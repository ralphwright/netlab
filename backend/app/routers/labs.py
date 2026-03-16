"""Lab listing and detail endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter()


@router.get("/")
async def list_labs(db: AsyncSession = Depends(get_db)):
    """Return all labs with topic tags and step counts."""
    result = await db.execute(text("""
        SELECT l.id, l.slug, l.title, l.subtitle, l.difficulty,
               l.estimated_minutes, l.is_integration, l.sort_order,
               array_agg(DISTINCT t.slug) FILTER (WHERE t.slug IS NOT NULL) AS topic_slugs,
               array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS topic_names,
               array_agg(DISTINCT t.color) FILTER (WHERE t.color IS NOT NULL) AS topic_colors,
               count(DISTINCT ls.id) AS step_count,
               coalesce(sum(ls.points), 0) AS total_points
        FROM labs l
        LEFT JOIN lab_topics lt ON lt.lab_id = l.id
        LEFT JOIN topics t ON t.id = lt.topic_id
        LEFT JOIN lab_steps ls ON ls.lab_id = l.id
        GROUP BY l.id
        ORDER BY l.sort_order
    """))
    rows = result.mappings().all()
    return [dict(r) for r in rows]


@router.get("/topics")
async def list_topics(db: AsyncSession = Depends(get_db)):
    """Return all topics."""
    result = await db.execute(text(
        "SELECT * FROM topics ORDER BY sort_order"
    ))
    return [dict(r) for r in result.mappings().all()]


@router.get("/{slug}")
async def get_lab(slug: str, db: AsyncSession = Depends(get_db)):
    """Return full lab detail including steps."""
    lab_result = await db.execute(text("""
        SELECT l.*, array_agg(DISTINCT t.slug) FILTER (WHERE t.slug IS NOT NULL) AS topic_slugs
        FROM labs l
        LEFT JOIN lab_topics lt ON lt.lab_id = l.id
        LEFT JOIN topics t ON t.id = lt.topic_id
        WHERE l.slug = :slug
        GROUP BY l.id
    """), {"slug": slug})
    lab = lab_result.mappings().first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    steps_result = await db.execute(text("""
        SELECT id, step_number, title, instruction, hint, explanation,
               target_device, expected_commands, validation_type,
               validation_rule, points
        FROM lab_steps
        WHERE lab_id = :lab_id
        ORDER BY step_number
    """), {"lab_id": lab["id"]})

    return {
        **dict(lab),
        "steps": [dict(s) for s in steps_result.mappings().all()],
    }
