from services.llm_service import score_answer, generate_session_report
from models.models import Question, InterviewSession, SessionReport
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid


async def score_question_answer(
    question: Question,
    answer: str,
    code_submission: str | None,
    db: AsyncSession
) -> Question:
    scores = await score_answer(
        question=question.question_text,
        answer=answer,
        round_type=question.question_type,
        code_submission=code_submission
    )

    question.candidate_answer = answer
    question.code_submission = code_submission
    question.score_correctness = scores.get("correctness", 0)
    question.score_communication = scores.get("communication", 0)
    question.score_edge_cases = scores.get("edge_case_handling", 0)
    question.score_complexity = scores.get("time_complexity_awareness", 0)
    question.score_overall = scores.get("overall", 0)
    question.feedback = scores.get("feedback", "")
    question.follow_up_topics = scores.get("suggested_follow_up_topics", [])
    question.answered_at = datetime.now(timezone.utc)

    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


async def finalize_session_report(session_id: str, db: AsyncSession) -> SessionReport:
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise ValueError(f"Session {session_id} not found")

    q_result = await db.execute(
        select(Question).where(Question.session_id == session_id)
    )
    questions = q_result.scalars().all()

    qa_list = [
        {
            "question": q.question_text,
            "answer": q.candidate_answer or "",
            "score": q.score_overall or 0,
            "feedback": q.feedback or ""
        }
        for q in questions if q.candidate_answer
    ]

    if not qa_list:
        avg_score = 0.0
    else:
        avg_score = sum(q["score"] for q in qa_list) / len(qa_list)

    report_data = await generate_session_report(
        track=session.track,
        questions_and_answers=qa_list,
        total_score=avg_score
    )

    transcript_pairs = [
        (
            {"speaker": "interviewer", "text": q.question_text, "timestamp": q.asked_at.isoformat() if q.asked_at else ""},
            {"speaker": "candidate", "text": q.candidate_answer or "", "timestamp": q.answered_at.isoformat() if q.answered_at else ""}
        )
        for q in questions
    ]
    flat_transcript = [item for pair in transcript_pairs for item in pair]

    report = SessionReport(
        id=str(uuid.uuid4()),
        session_id=session_id,
        overall_score=avg_score,
        strengths=report_data.get("strengths", ""),
        weaknesses=report_data.get("weaknesses", ""),
        recommendations=report_data.get("recommendations", ""),
        category_scores=report_data.get("category_scores", {}),
        full_transcript=flat_transcript
    )

    session.status = "done"
    session.total_score = avg_score
    session.ended_at = datetime.now(timezone.utc)

    db.add(report)
    db.add(session)
    await db.commit()
    await db.refresh(report)
    return report
