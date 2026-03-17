"""Theory content endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter()


@router.get("/")
async def list_theory(db: AsyncSession = Depends(get_db)):
    """Return all topics with a flag indicating whether theory content exists."""
    result = await db.execute(text("""
        SELECT t.slug, t.name, t.description, t.icon, t.color, t.sort_order,
               tc.id IS NOT NULL AS has_content,
               tc.osi_layer
        FROM topics t
        LEFT JOIN topic_content tc ON tc.topic_id = t.id
        ORDER BY t.sort_order
    """))
    return [dict(r) for r in result.mappings().all()]


@router.get("/{slug}")
async def get_theory(slug: str, db: AsyncSession = Depends(get_db)):
    """Return full theory content for a topic, including related labs."""
    result = await db.execute(text("""
        SELECT t.slug, t.name, t.description, t.icon, t.color,
               tc.osi_layer, tc.rfc_references,
               tc.theory_md, tc.practical_md,
               tc.diagram_type, tc.diagram_data,
               tc.key_commands, tc.common_mistakes
        FROM topics t
        JOIN topic_content tc ON tc.topic_id = t.id
        WHERE t.slug = :slug
    """), {"slug": slug})
    row = result.mappings().first()

    if not row:
        raise HTTPException(404, f"Theory content not found for topic: {slug}")

    # Get related labs
    labs_result = await db.execute(text("""
        SELECT l.slug, l.title, l.difficulty, l.estimated_minutes,
               count(ls.id) AS step_count
        FROM labs l
        JOIN lab_topics lt ON lt.lab_id = l.id
        JOIN topics t ON t.id = lt.topic_id
        LEFT JOIN lab_steps ls ON ls.lab_id = l.id
        WHERE t.slug = :slug
        GROUP BY l.id
        ORDER BY l.sort_order
    """), {"slug": slug})

    return {
        **dict(row),
        "related_labs": [dict(l) for l in labs_result.mappings().all()],
    }
