"""
SintraPrime Primary API
Workers + Make.com talk to Primary through this

Endpoints:
- GET /job/next - Atomic job claiming for workers
- POST /job/complete - Workers report completion
- POST /event - External events from Make.com/webhooks
- POST /notice/send - Start escalation clock
- GET /health - Health check
- GET /stats - System statistics
"""

import json
import sqlite3
from datetime import datetime
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel
from .db import connect
from .event_bus import emit
from sintraprime.voice.conductor import start as start_voice, say

app = FastAPI(title="SintraPrime Primary API", version="Ω-DOMINANCE v1")

class EventIn(BaseModel):
    event_type: str
    payload: dict
    priority: int = 3

class JobComplete(BaseModel):
    job_id: int
    worker_id: str
    status: str  # COMPLETED or FAILED
    result: dict

class JobOut(BaseModel):
    id: int
    event_type: str
    payload: dict
    priority: int
    created_at: str

@app.on_event("startup")
def boot():
    """Startup announcement"""
    start_voice()
    now = datetime.now().strftime("%B %d, %Y %I:%M %p")
    say("SINTRAPRIME", f"System online. Time is {now}. Dominance modules active.")

@app.get("/health")
def health():
    """Health check"""
    return {"ok": True, "service": "sintraprime-primary", "version": "omega-dominance-v1"}

@app.get("/stats")
def stats():
    """Get system statistics"""
    conn = connect()
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM jobs WHERE status='PENDING'")
    pending = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM jobs WHERE status='COMPLETED'")
    completed = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM jobs WHERE status='FAILED'")
    failed = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM timelines")
    timeline_events = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(DISTINCT case_id) FROM timelines WHERE event='NOTICE_SENT'")
    active_cases = cur.fetchone()[0]
    
    conn.close()
    
    return {
        "jobs": {
            "pending": pending,
            "completed": completed,
            "failed": failed
        },
        "timeline_events": timeline_events,
        "active_cases": active_cases
    }

@app.get("/job/next", response_model=Optional[JobOut])
def job_next(worker_id: str, types: str = ""):
    """
    Atomic job claiming for workers
    
    Args:
        worker_id: Worker identifier
        types: Optional comma-separated event types this worker can handle
        
    Returns:
        Next available job or None
    """
    allowed = [t.strip() for t in types.split(",") if t.strip()]
    conn = connect()
    cur = conn.cursor()

    # Atomic claim: select + update within same connection
    if allowed:
        q_marks = ",".join(["?"] * len(allowed))
        cur.execute(
            f"""SELECT id, event_type, payload, priority, created_at
                FROM jobs
                WHERE status='PENDING' AND event_type IN ({q_marks})
                ORDER BY priority ASC, created_at ASC
                LIMIT 1""",
            allowed
        )
    else:
        cur.execute(
            """SELECT id, event_type, payload, priority, created_at
               FROM jobs
               WHERE status='PENDING'
               ORDER BY priority ASC, created_at ASC
               LIMIT 1"""
        )

    row = cur.fetchone()
    if not row:
        conn.close()
        return None

    job_id, event_type, payload, priority, created_at = row

    # Claim it atomically
    cur.execute(
        "UPDATE jobs SET status='CLAIMED', claimed_at=?, worker_id=? WHERE id=? AND status='PENDING'",
        (datetime.now().isoformat(), worker_id, job_id)
    )
    conn.commit()

    # Confirm claim succeeded (avoid race conditions)
    cur.execute("SELECT status FROM jobs WHERE id=?", (job_id,))
    status = cur.fetchone()[0]
    conn.close()

    if status != "CLAIMED":
        return None

    print(f"[Primary] ✅ Job #{job_id} claimed by {worker_id} ({event_type})")

    return JobOut(
        id=job_id,
        event_type=event_type,
        payload=json.loads(payload),
        priority=priority,
        created_at=created_at
    )

@app.post("/event")
def ingest_event(e: EventIn):
    """
    Ingest external event (from Make.com, webhooks, etc.)
    
    Special handling for certain event types:
    - WEEKLY_BRIEFING_READY: Speaks the briefing immediately
    - CERTIFIED_MAIL_SUBMITTED: Vault Guardian testimony
    
    Example:
        POST /event
        {
            "event_type": "NOTION_CASE_UPDATED",
            "payload": {"case_id": "CASE-001", "stage": "NOTICE_SENT"},
            "priority": 2
        }
    """
    emit(e.event_type, e.payload, e.priority)
    
    # Special handling: Weekly briefing
    if e.event_type == "WEEKLY_BRIEFING_READY":
        text = e.payload.get("text", "")
        say("SINTRAPRIME", text)
        return {"spoken": True, "event_type": e.event_type}
    
    # Special handling: Certified mail submitted
    if e.event_type == "CERTIFIED_MAIL_SUBMITTED":
        case_id = e.payload.get("case_id", "UNKNOWN")
        provider = e.payload.get("provider", "MAIL_PROVIDER")
        job_id = e.payload.get("provider_job_id", "UNKNOWN")
        say("VAULT_GUARDIAN", f"Certified mail submitted for case {case_id}. Provider {provider}. Reference {job_id}.")
        return {"recorded": True, "event_type": e.event_type}
    
    # Speak important external events
    if e.priority <= 2:
        say("SENTINEL", f"External event received: {e.event_type}.")
    
    return {"queued": True, "event_type": e.event_type}

@app.post("/job/complete")
def job_complete(j: JobComplete):
    """
    Workers report job completion
    
    Example:
        POST /job/complete
        {
            "job_id": 123,
            "worker_id": "cert-mail-01",
            "status": "COMPLETED",
            "result": {"tracking": "ABC123"}
        }
    """
    conn = connect()
    conn.execute(
        """UPDATE jobs SET status=?, completed_at=?, result=?, worker_id=?
           WHERE id=?""",
        (j.status, datetime.now().isoformat(), json.dumps(j.result), j.worker_id, j.job_id)
    )
    conn.commit()
    conn.close()
    
    # Narrated testimony for completions
    if j.status == "COMPLETED":
        say("VAULT_GUARDIAN", f"Job {j.job_id} completed by {j.worker_id}.")
    else:
        say("SENTINEL", f"Job {j.job_id} failed on {j.worker_id}.")
    
    return {"recorded": True}

@app.post("/notice/send")
def send_notice(case_id: str, recipient: str):
    """
    Record a notice being sent (starts the escalation clock)
    
    Example:
        POST /notice/send?case_id=CASE-001&recipient=user@example.com
    """
    from .timeline_engine import record_notice
    
    record_notice(case_id, {"recipient": recipient})
    say("SINTRAPRIME", f"Notice recorded for case {case_id}. Escalation timeline started.")
    
    return {"case_id": case_id, "status": "notice_recorded", "recipient": recipient}
