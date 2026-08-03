from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from db.database import get_db
from models.models import InterviewSession, Question
from routers.deps import get_current_user

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/overview")
async def get_overview(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    sessions_result = await db.execute(
        select(InterviewSession).where(InterviewSession.user_id == current_user.id)
    )
    sessions = sessions_result.scalars().all()

    total_sessions = len(sessions)
    completed = [s for s in sessions if s.status == "done"]
    avg_score = (
        sum(s.total_score for s in completed if s.total_score) / len(completed)
        if completed else 0
    )

    track_counts = {}
    for s in sessions:
        track_counts[s.track] = track_counts.get(s.track, 0) + 1

    return {
        "total_sessions": total_sessions,
        "completed_sessions": len(completed),
        "average_score": round(avg_score, 1),
        "sessions_by_track": track_counts,
        "recent_sessions": [
            {
                "id": s.id,
                "track": s.track,
                "difficulty": s.difficulty,
                "status": s.status,
                "total_score": s.total_score,
                "created_at": s.created_at.isoformat()
            }
            for s in sorted(sessions, key=lambda x: x.created_at, reverse=True)[:5]
        ]
    }
