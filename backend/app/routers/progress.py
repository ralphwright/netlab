"""User progress tracking endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter()


class ProgressUpdate(BaseModel):
    user_id: str = "student"
    lab_slug: str
    current_step: int
    points_earned: int = 0


class StepComplete(BaseModel):
    user_id: str = "student"
    lab_slug: str
    step_number: int
    points: int = 0


class SaveProgress(BaseModel):
    """Simple bulk save — the frontend sends everything it knows."""
    user_id: str = "student"
    lab_slug: str
    current_step: int = 1
    completed_steps: List[int] = []
    total_points: int = 0


# ── TEST: verify the save pipeline works ─────────────────────

@router.get("/test-save")
async def test_save_pipeline(db: AsyncSession = Depends(get_db)):
    """Hit this in a browser to verify DB writes work end-to-end."""
    results = {}

    # 1. Check user exists
    r = await db.execute(text("SELECT id, username FROM users WHERE username = 'student'"))
    user = r.mappings().first()
    results["user"] = dict(user) if user else "MISSING — this is the problem"
    if not user:
        # Try to create
        await db.execute(text(
            "INSERT INTO users (username, display_name) VALUES ('student', 'Student') ON CONFLICT DO NOTHING"
        ))
        await db.commit()
        r2 = await db.execute(text("SELECT id FROM users WHERE username = 'student'"))
        u2 = r2.mappings().first()
        results["user_created"] = bool(u2)

    # 2. Check a lab with steps exists
    r = await db.execute(text("""
        SELECT l.slug, l.id, count(ls.id) as step_count
        FROM labs l LEFT JOIN lab_steps ls ON ls.lab_id = l.id
        GROUP BY l.id HAVING count(ls.id) > 0 LIMIT 1
    """))
    lab = r.mappings().first()
    results["lab_with_steps"] = dict(lab) if lab else "NO LABS HAVE STEPS"

    if not lab:
        return results

    # 3. Check that steps have expected_commands
    r = await db.execute(text("""
        SELECT step_number, title, expected_commands
        FROM lab_steps WHERE lab_id = :lid ORDER BY step_number LIMIT 3
    """), {"lid": lab["id"]})
    steps = [dict(s) for s in r.mappings().all()]
    results["sample_steps"] = steps

    # 4. Try writing to user_lab_progress
    if user:
        try:
            await db.execute(text("""
                INSERT INTO user_lab_progress (user_id, lab_id, status, current_step, total_points, started_at)
                VALUES (:uid, :lid, 'in_progress', 1, 0, NOW())
                ON CONFLICT (user_id, lab_id) DO UPDATE SET current_step = 1
            """), {"uid": user["id"], "lid": lab["id"]})
            await db.commit()
            results["write_test"] = "SUCCESS"
        except Exception as e:
            results["write_test"] = f"FAILED: {e}"

        # 5. Read back
        r = await db.execute(text("""
            SELECT status, current_step, total_points
            FROM user_lab_progress WHERE user_id = :uid AND lab_id = :lid
        """), {"uid": user["id"], "lid": lab["id"]})
        row = r.mappings().first()
        results["read_back"] = dict(row) if row else "NOTHING — write didn't persist"

        # 6. Clean up
        await db.execute(text(
            "DELETE FROM user_lab_progress WHERE user_id = :uid AND lab_id = :lid"
        ), {"uid": user["id"], "lid": lab["id"]})
        await db.commit()
        results["cleanup"] = "done"

    return results


# ── SIMPLE SAVE: bulk-save from frontend ─────────────────────

@router.post("/save")
async def save_progress(req: SaveProgress, db: AsyncSession = Depends(get_db)):
    """Simple bulk save — wrapped in try/catch to surface the actual error."""
    import traceback

    try:
        # Auto-create user
        await db.execute(text("""
            INSERT INTO users (username, display_name)
            VALUES (:user, :user)
            ON CONFLICT (username) DO NOTHING
        """), {"user": req.user_id})

        # Get lab ID
        lab_r = await db.execute(text("SELECT id FROM labs WHERE slug = :slug"), {"slug": req.lab_slug})
        lab_row = lab_r.mappings().first()
        if not lab_row:
            return {"error": f"Lab not found: {req.lab_slug}"}
        lab_id = lab_row["id"]

        # Get user ID
        user_r = await db.execute(text("SELECT id FROM users WHERE username = :user"), {"user": req.user_id})
        user_row = user_r.mappings().first()
        user_id = user_row["id"]

        # Get total step count
        count_r = await db.execute(text("SELECT count(*) FROM lab_steps WHERE lab_id = :lid"), {"lid": lab_id})
        total_steps = count_r.scalar() or 0

        is_complete = len(req.completed_steps) >= total_steps and total_steps > 0

        # Upsert lab-level progress — use separate INSERT/UPDATE to avoid type cast issues
        existing = await db.execute(text("""
            SELECT id FROM user_lab_progress WHERE user_id = :uid AND lab_id = :lid
        """), {"uid": user_id, "lid": lab_id})
        exists = existing.mappings().first()

        if exists:
            if is_complete:
                await db.execute(text("""
                    UPDATE user_lab_progress SET
                        current_step = :step, total_points = :pts,
                        status = 'completed', completed_at = NOW()
                    WHERE user_id = :uid AND lab_id = :lid
                """), {"uid": user_id, "lid": lab_id, "step": req.current_step, "pts": req.total_points})
            else:
                await db.execute(text("""
                    UPDATE user_lab_progress SET
                        current_step = :step, total_points = :pts,
                        status = 'in_progress'
                    WHERE user_id = :uid AND lab_id = :lid
                """), {"uid": user_id, "lid": lab_id, "step": req.current_step, "pts": req.total_points})
        else:
            if is_complete:
                await db.execute(text("""
                    INSERT INTO user_lab_progress (user_id, lab_id, status, current_step, total_points, started_at, completed_at)
                    VALUES (:uid, :lid, 'completed', :step, :pts, NOW(), NOW())
                """), {"uid": user_id, "lid": lab_id, "step": req.current_step, "pts": req.total_points})
            else:
                await db.execute(text("""
                    INSERT INTO user_lab_progress (user_id, lab_id, status, current_step, total_points, started_at)
                    VALUES (:uid, :lid, 'in_progress', :step, :pts, NOW())
                """), {"uid": user_id, "lid": lab_id, "step": req.current_step, "pts": req.total_points})

        # Upsert each completed step
        for step_num in (req.completed_steps or []):
            step_r = await db.execute(text(
                "SELECT id FROM lab_steps WHERE lab_id = :lid AND step_number = :sn"
            ), {"lid": lab_id, "sn": step_num})
            step_row = step_r.mappings().first()
            if step_row:
                # Check if already exists
                existing_step = await db.execute(text(
                    "SELECT id FROM user_step_progress WHERE user_id = :uid AND step_id = :sid"
                ), {"uid": user_id, "sid": step_row["id"]})
                if existing_step.mappings().first():
                    await db.execute(text("""
                        UPDATE user_step_progress SET status = 'completed'
                        WHERE user_id = :uid AND step_id = :sid
                    """), {"uid": user_id, "sid": step_row["id"]})
                else:
                    await db.execute(text("""
                        INSERT INTO user_step_progress (user_id, lab_id, step_id, status, attempts, completed_at)
                        VALUES (:uid, :lid, :sid, 'completed', 1, NOW())
                    """), {"uid": user_id, "lid": lab_id, "sid": step_row["id"]})

        await db.commit()

        return {
            "status": "saved",
            "completed_steps": len(req.completed_steps),
            "total_steps": total_steps,
        }

    except Exception as e:
        await db.rollback()
        tb = traceback.format_exc()
        print(f"[netlab] SAVE ERROR: {e}\n{tb}")
        # Return the actual error so the frontend displays it
        return {"error": str(e), "detail": str(e)}


# ── Get all lab progress for a user ──────────────────────────

@router.get("/{username}")
async def get_user_progress(username: str, db: AsyncSession = Depends(get_db)):
    """Get all lab progress for a user."""
    result = await db.execute(text("""
        SELECT ulp.status, ulp.current_step, ulp.total_points, ulp.max_points,
               ulp.started_at, ulp.completed_at, ulp.device_configs,
               l.slug AS lab_slug, l.title AS lab_title,
               count(DISTINCT ls.id) AS total_steps
        FROM user_lab_progress ulp
        JOIN labs l ON l.id = ulp.lab_id
        JOIN users u ON u.id = ulp.user_id
        LEFT JOIN lab_steps ls ON ls.lab_id = l.id
        WHERE u.username = :username
        GROUP BY ulp.id, l.slug, l.title
        ORDER BY ulp.started_at DESC NULLS LAST
    """), {"username": username})
    return [dict(r) for r in result.mappings().all()]


# ── Achievements (must be before /{username}/{lab_slug}) ─────

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


# ── Get progress for a specific lab ──────────────────────────

@router.get("/{username}/{lab_slug}")
async def get_lab_progress(username: str, lab_slug: str, db: AsyncSession = Depends(get_db)):
    """Get detailed progress for a specific lab, including which steps are completed."""

    # Lab-level progress
    lab_result = await db.execute(text("""
        SELECT ulp.status, ulp.current_step, ulp.total_points, ulp.device_configs
        FROM user_lab_progress ulp
        JOIN labs l ON l.id = ulp.lab_id
        JOIN users u ON u.id = ulp.user_id
        WHERE u.username = :username AND l.slug = :slug
    """), {"username": username, "slug": lab_slug})
    lab_progress = lab_result.mappings().first()

    # Step-level progress (which steps have been completed)
    steps_result = await db.execute(text("""
        SELECT usp.step_id, ls.step_number, usp.status, usp.attempts, usp.completed_at
        FROM user_step_progress usp
        JOIN lab_steps ls ON ls.id = usp.step_id
        JOIN labs l ON l.id = usp.lab_id
        JOIN users u ON u.id = usp.user_id
        WHERE u.username = :username AND l.slug = :slug
        ORDER BY ls.step_number
    """), {"username": username, "slug": lab_slug})
    step_rows = steps_result.mappings().all()

    completed_steps = [
        row["step_number"] for row in step_rows
        if row["status"] == "completed"
    ]

    return {
        "lab_slug": lab_slug,
        "status": lab_progress["status"] if lab_progress else "not_started",
        "current_step": lab_progress["current_step"] if lab_progress else 1,
        "total_points": lab_progress["total_points"] if lab_progress else 0,
        "completed_steps": completed_steps,
        "step_details": [dict(s) for s in step_rows],
    }


# ── Mark a single step as completed ─────────────────────────

@router.post("/complete-step")
async def complete_step(req: StepComplete, db: AsyncSession = Depends(get_db)):
    """Mark a specific step as completed and update lab-level progress."""

    # Auto-create user if they don't exist (seed may have partially failed)
    await db.execute(text("""
        INSERT INTO users (username, display_name)
        VALUES (:user, :user)
        ON CONFLICT (username) DO NOTHING
    """), {"user": req.user_id})

    # Get IDs
    ids = await db.execute(text("""
        SELECT u.id AS user_id, l.id AS lab_id, ls.id AS step_id
        FROM users u, labs l, lab_steps ls
        WHERE u.username = :user AND l.slug = :slug
          AND ls.lab_id = l.id AND ls.step_number = :step_num
    """), {"user": req.user_id, "slug": req.lab_slug, "step_num": req.step_number})
    row = ids.mappings().first()

    if not row:
        # Return 422 so frontend .catch() actually fires
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail=f"Lookup failed: user={req.user_id}, lab={req.lab_slug}, step={req.step_number}"
        )

    user_id = row["user_id"]
    lab_id = row["lab_id"]
    step_id = row["step_id"]

    # Upsert step progress
    await db.execute(text("""
        INSERT INTO user_step_progress (user_id, lab_id, step_id, status, attempts, completed_at)
        VALUES (:uid, :lid, :sid, 'completed', 1, NOW())
        ON CONFLICT (user_id, step_id) DO UPDATE SET
            status = 'completed',
            attempts = user_step_progress.attempts + 1,
            completed_at = COALESCE(user_step_progress.completed_at, NOW())
    """), {"uid": user_id, "lid": lab_id, "sid": step_id})

    # Upsert lab-level progress
    total_steps = await db.execute(text(
        "SELECT count(*) FROM lab_steps WHERE lab_id = :lid"
    ), {"lid": lab_id})
    step_count = total_steps.scalar() or 1

    completed_count = await db.execute(text("""
        SELECT count(*) FROM user_step_progress
        WHERE user_id = :uid AND lab_id = :lid AND status = 'completed'
    """), {"uid": user_id, "lid": lab_id})
    done = completed_count.scalar() or 0

    is_complete = done >= step_count
    new_status = "completed" if is_complete else "in_progress"

    await db.execute(text("""
        INSERT INTO user_lab_progress (user_id, lab_id, status, current_step, total_points, started_at, completed_at)
        VALUES (:uid, :lid, :status, :step, :pts, NOW(),
                CASE WHEN :is_done THEN NOW() ELSE NULL END)
        ON CONFLICT (user_id, lab_id) DO UPDATE SET
            current_step = GREATEST(user_lab_progress.current_step, :step),
            total_points = user_lab_progress.total_points + :pts,
            status = :status::lab_status,
            completed_at = CASE WHEN :is_done THEN NOW() ELSE user_lab_progress.completed_at END
    """), {
        "uid": user_id, "lid": lab_id,
        "status": new_status, "step": req.step_number,
        "pts": req.points, "is_done": is_complete,
    })

    await db.commit()

    return {
        "status": "saved",
        "lab_status": new_status,
        "completed_steps": done,
        "total_steps": step_count,
    }


# ── Update lab-level progress (legacy / bulk) ────────────────

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


# ── Reset progress for a single lab ──────────────────────────

@router.delete("/{username}/{lab_slug}")
async def reset_lab_progress(username: str, lab_slug: str, db: AsyncSession = Depends(get_db)):
    """Reset all progress for a specific lab."""
    # Delete step progress
    await db.execute(text("""
        DELETE FROM user_step_progress
        WHERE user_id = (SELECT id FROM users WHERE username = :user)
          AND lab_id = (SELECT id FROM labs WHERE slug = :slug)
    """), {"user": username, "slug": lab_slug})

    # Delete command history
    await db.execute(text("""
        DELETE FROM command_history
        WHERE user_id = (SELECT id FROM users WHERE username = :user)
          AND lab_id = (SELECT id FROM labs WHERE slug = :slug)
    """), {"user": username, "slug": lab_slug})

    # Delete lab progress
    await db.execute(text("""
        DELETE FROM user_lab_progress
        WHERE user_id = (SELECT id FROM users WHERE username = :user)
          AND lab_id = (SELECT id FROM labs WHERE slug = :slug)
    """), {"user": username, "slug": lab_slug})

    await db.commit()
    return {"status": "reset", "lab": lab_slug}


# ── Reset ALL progress for a user ────────────────────────────

@router.delete("/{username}")
async def reset_all_progress(username: str, db: AsyncSession = Depends(get_db)):
    """Reset all progress across all labs for a user."""
    uid_result = await db.execute(text(
        "SELECT id FROM users WHERE username = :user"
    ), {"user": username})
    uid_row = uid_result.mappings().first()
    if not uid_row:
        return {"error": "User not found"}
    uid = uid_row["id"]

    await db.execute(text("DELETE FROM user_step_progress WHERE user_id = :uid"), {"uid": uid})
    await db.execute(text("DELETE FROM command_history WHERE user_id = :uid"), {"uid": uid})
    await db.execute(text("DELETE FROM user_lab_progress WHERE user_id = :uid"), {"uid": uid})
    await db.execute(text("DELETE FROM user_achievements WHERE user_id = :uid"), {"uid": uid})

    await db.commit()
    return {"status": "all_reset"}

