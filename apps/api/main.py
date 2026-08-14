from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
import base64
import os

from db.database import init_db, get_db
from websocket_manager.manager import manager
from routers import auth, interviews, code, analytics
from services.llm_service import generate_question, generate_follow_up, score_answer, transcribe_audio


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="InterviewForge API", version="1.0.0", lifespan=lifespan)

# CORS: always allow local dev, plus any origin(s) in FRONTEND_URL
# (comma-separated), plus every Vercel preview/prod domain via regex.
_frontend_env = os.getenv("FRONTEND_URL", "http://localhost:3000")
_allowed_origins = ["http://localhost:3000"] + [o.strip() for o in _frontend_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(_allowed_origins)),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(interviews.router)
app.include_router(code.router)
app.include_router(analytics.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(None)
):
    # Validate token
    from jose import jwt, JWTError
    from sqlalchemy import select
    from models.models import User, InterviewSession, Question
    from db.database import AsyncSessionLocal
    import uuid
    from datetime import datetime, timezone

    SECRET_KEY = os.getenv("JWT_SECRET", "changeme-secret-key-for-dev-only")
    user_id = None

    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("sub")
        except JWTError:
            await websocket.close(code=4001)
            return

    await manager.connect(websocket, session_id)

    async with AsyncSessionLocal() as db:
        # Load session
        s_result = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
        session = s_result.scalar_one_or_none()

        if not session:
            await websocket.send_json({"type": "error", "message": "Session not found"})
            await websocket.close()
            return

        await websocket.send_json({"type": "connected", "session_id": session_id, "status": session.status})

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type")

            async with AsyncSessionLocal() as db:
                if msg_type == "ready":
                    # Start the interview - generate first question
                    s_result = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
                    session = s_result.scalar_one_or_none()

                    if session and session.status == "setup":
                        session.status = "active"
                        session.started_at = datetime.now(timezone.utc)
                        db.add(session)

                        question_text = await generate_question(
                            track=session.track,
                            difficulty=session.difficulty,
                            company_tier=session.company_tier,
                            round_type=session.track,
                            question_number=1
                        )

                        question = Question(
                            id=str(uuid.uuid4()),
                            session_id=session_id,
                            question_text=question_text,
                            question_type=session.track,
                            order_index=0
                        )
                        db.add(question)
                        await db.commit()

                        await manager.send_to_session(session_id, {
                            "type": "question",
                            "data": {
                                "id": question.id,
                                "text": question_text,
                                "index": 0,
                                "type": session.track
                            }
                        })

                elif msg_type == "audio_chunk":
                    # Transcribe audio and process answer
                    audio_b64 = msg.get("data", "")
                    audio_bytes = base64.b64decode(audio_b64)

                    try:
                        transcript = await transcribe_audio(audio_bytes)
                    except Exception as e:
                        transcript = msg.get("text_fallback", "")

                    if transcript:
                        await manager.send_to_session(session_id, {
                            "type": "transcript",
                            "text": transcript,
                            "speaker": "candidate"
                        })

                elif msg_type == "text_answer":
                    # Text-based answer submission
                    answer_text = msg.get("text", "")
                    question_id = msg.get("question_id", "")
                    code_submission = msg.get("code", None)

                    q_result = await db.execute(
                        select(Question).where(Question.id == question_id, Question.session_id == session_id)
                    )
                    question = q_result.scalar_one_or_none()

                    if question and answer_text:
                        scores = await score_answer(
                            question=question.question_text,
                            answer=answer_text,
                            round_type=question.question_type,
                            code_submission=code_submission
                        )

                        question.candidate_answer = answer_text
                        question.code_submission = code_submission
                        question.score_overall = scores.get("overall", 0)
                        question.score_correctness = scores.get("correctness", 0)
                        question.score_communication = scores.get("communication", 0)
                        question.score_edge_cases = scores.get("edge_case_handling", 0)
                        question.score_complexity = scores.get("time_complexity_awareness", 0)
                        question.feedback = scores.get("feedback", "")
                        question.follow_up_topics = scores.get("suggested_follow_up_topics", [])
                        question.answered_at = datetime.now(timezone.utc)
                        db.add(question)
                        await db.commit()

                        await manager.send_to_session(session_id, {
                            "type": "score_update",
                            "data": scores
                        })

                        # Generate follow-up or next question
                        follow_up = await generate_follow_up(
                            question=question.question_text,
                            candidate_answer=answer_text,
                            round_type=question.question_type,
                            track=session.track if session else "fullstack"
                        )

                        await manager.send_to_session(session_id, {
                            "type": "interviewer_response",
                            "text": follow_up
                        })

                elif msg_type == "next_question":
                    s_result = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
                    session = s_result.scalar_one_or_none()

                    q_result = await db.execute(
                        select(Question).where(Question.session_id == session_id).order_by(Question.order_index.desc())
                    )
                    questions = q_result.scalars().all()
                    next_index = len(questions)

                    context = ""
                    for q in questions[-3:]:
                        if q.candidate_answer:
                            context += f"Q: {q.question_text}\nA: {q.candidate_answer}\n\n"

                    question_text = await generate_question(
                        track=session.track,
                        difficulty=session.difficulty,
                        company_tier=session.company_tier,
                        round_type=session.track,
                        previous_context=context,
                        question_number=next_index + 1
                    )

                    question = Question(
                        id=str(uuid.uuid4()),
                        session_id=session_id,
                        question_text=question_text,
                        question_type=session.track,
                        order_index=next_index
                    )
                    db.add(question)
                    await db.commit()

                    await manager.send_to_session(session_id, {
                        "type": "question",
                        "data": {
                            "id": question.id,
                            "text": question_text,
                            "index": next_index,
                            "type": session.track
                        }
                    })

                elif msg_type == "end_session":
                    from services.scoring_service import finalize_session_report
                    try:
                        report = await finalize_session_report(session_id, db)
                        await manager.send_to_session(session_id, {
                            "type": "session_end",
                            "report_id": report.id,
                            "overall_score": report.overall_score
                        })
                    except Exception as e:
                        await manager.send_to_session(session_id, {
                            "type": "error",
                            "message": str(e)
                        })

    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
    except Exception as e:
        manager.disconnect(websocket, session_id)
