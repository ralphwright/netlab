"""User progress tracking endpoints."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter()


class ProgressUpdate(BaseModel):
    user_id: str = "student"
    lab_slug: str
    current_step: int
    points_earned: int = 0


@router.get("/{username}")
async def get_user_progress(username: str, db: AsyncSession = Depends(get_db)):
    """Get all lab progress for a user."""
    result = await db.execute(text("""
        SELECT ulp.*, l.slug AS lab_slug, l.title AS lab_title
        FROM user_lab_progress ulp
        JOIN labs l ON l.id = ulp.lab_id
        JOIN users u ON u.id = ulp.user_id
        WHERE u.username = :username
        ORDER BY ulp.started_at DESC NULLS LAST
    """), {"username": username})
    return [dict(r) for r in result.mappings().all()]


@router.post("/update")
async def update_progress(req: ProgressUpdate, db: AsyncSession = Depends(get_db)):
    """Update lab progress for a user."""
    await db.execute(text("""
        INSERT INTO user_lab_progress (user_id, lab_id, status, current_step, total_points, started_at)
        SELECT u.id, l.id, 'in_progress', :step, :points, NOW()
        FROM users u, labs l
        WHERE u.username = :user AND l.slug = :slug
        ON CONFLICT (user_id, lab_id) DO UPDATE SET
            current_step = GREATEST(user_lab_progress.current_step, :step),
            total_points = user_lab_progress.total_points + :points,
            status = CASE
                WHEN :step >= (SELECT count(*) FROM lab_steps WHERE lab_id = user_lab_progress.lab_id)
                THEN 'completed'::lab_status
                ELSE 'in_progress'::lab_status
            END,
            completed_at = CASE
                WHEN :step >= (SELECT count(*) FROM lab_steps WHERE lab_id = user_lab_progress.lab_id)
                THEN NOW()
                ELSE NULL
            END
    """), {
        "user": req.user_id,
        "slug": req.lab_slug,
        "step": req.current_step,
        "points": req.points_earned,
    })
    await db.commit()
    return {"status": "updated"}


@router.get("/{username}/achievements")
async def get_achievements(username: str, db: AsyncSession = Depends(get_db)):
    """Get user's earned achievements."""
    result = await db.execute(text("""
        SELECT a.slug, a.name, a.description, a.icon, ua.earned_at
        FROM user_achievements ua
        JOIN achievements a ON a.id = ua.achievement_id
        JOIN users u ON u.id = ua.user_id
        WHERE u.username = :username
        ORDER BY ua.earned_at DESC
    """), {"username": username})
    return [dict(r) for r in result.mappings().all()]
