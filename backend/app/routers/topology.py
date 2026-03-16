"""Topology endpoints — devices, interfaces, links for D3 visualisation."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter()


@router.get("/{lab_slug}")
async def get_topology(lab_slug: str, db: AsyncSession = Depends(get_db)):
    """Return complete topology graph for a lab (nodes + edges)."""
    lab = await db.execute(
        text("SELECT id FROM labs WHERE slug = :slug"), {"slug": lab_slug}
    )
    lab_row = lab.mappings().first()
    if not lab_row:
        raise HTTPException(404, "Lab not found")
    lab_id = lab_row["id"]

    devices = await db.execute(text("""
        SELECT id, name, device_type, model, x_pos, y_pos, properties, initial_config
        FROM devices WHERE lab_id = :lab_id
    """), {"lab_id": lab_id})

    interfaces = await db.execute(text("""
        SELECT i.id, i.device_id, i.name, i.short_name, i.ip_address,
               i.subnet_mask, i.vlan_id, i.is_trunk, i.status, i.properties
        FROM interfaces i
        JOIN devices d ON d.id = i.device_id
        WHERE d.lab_id = :lab_id
    """), {"lab_id": lab_id})

    links = await db.execute(text("""
        SELECT id, source_if_id, target_if_id, link_type, bandwidth, label, properties
        FROM links WHERE lab_id = :lab_id
    """), {"lab_id": lab_id})

    return {
        "lab_id": str(lab_id),
        "devices": [dict(d) for d in devices.mappings().all()],
        "interfaces": [dict(i) for i in interfaces.mappings().all()],
        "links": [dict(l) for l in links.mappings().all()],
    }
