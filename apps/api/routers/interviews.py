from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid

from db.database import get_db
from models.models import InterviewSession, Question
from schemas.schemas import SessionCreate, SessionOut, QuestionOut, AnswerSubmit
from services.llm_service import generate_question, generate_follow_up
from services.scoring_service import score_question_answer, finalize_session_report
from routers.deps import get_current_user

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


@router.post("", response_model=SessionOut)
async def create_session(
    data: SessionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session = InterviewSession(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        track=data.track,
        difficulty=data.difficulty,
        company_tier=data.company_tier,
        status="setup",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("", response_model=list[SessionOut])
async def list_sessions(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/{session_id}/start", response_model=QuestionOut)
async def start_session(
    session_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "active"
    session.started_at = datetime.now(timezone.utc)

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
    db.add(session)
    await db.commit()
    await db.refresh(question)
    return question


@router.post("/{session_id}/answer", response_model=QuestionOut)
async def submit_answer(
    session_id: str,
    data: AnswerSubmit,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    q_result = await db.execute(
        select(Question).where(Question.id == data.question_id, Question.session_id == session_id)
    )
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    scored_question = await score_question_answer(
        question=question,
        answer=data.answer_text,
        code_submission=data.code_submission,
        db=db
    )
    return scored_question


@router.post("/{session_id}/next-question", response_model=QuestionOut)
async def next_question(
    session_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    s_result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id
        )
    )
    session = s_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    q_result = await db.execute(
        select(Question)
        .where(Question.session_id == session_id)
        .order_by(Question.order_index.desc())
    )
    questions = q_result.scalars().all()
    next_index = len(questions)

    # Build context from previous answered questions
    context = ""
    for q in questions[:3]:  # Last 3 for context
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
    await db.refresh(question)
    return question


@router.post("/{session_id}/end")
async def end_session(
    session_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    report = await finalize_session_report(session_id, db)
    return {"report_id": report.id, "session_id": session_id}


@router.get("/{session_id}/questions", response_model=list[QuestionOut])
async def get_questions(
    session_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Question)
        .where(Question.session_id == session_id)
        .order_by(Question.order_index)
    )
    return result.scalars().all()


@router.get("/{session_id}/report")
async def get_report(
    session_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from models.models import SessionReport
    from schemas.schemas import ReportOut
    result = await db.execute(
        select(SessionReport).where(SessionReport.session_id == session_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found. End the session first.")
    return ReportOut.model_validate(report)
