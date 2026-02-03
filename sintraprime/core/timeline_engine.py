"""
SintraPrime Legal Timeline Engine
24/48/72 Escalation + Narrated Testimony

RULE: Time creates pressure automatically.
Silence becomes evidence. Every delay has narration.

ESCALATIONS CREATE REAL JOBS (not just events)
"""

from datetime import datetime, timedelta
from .db import connect
from .event_bus import emit

# Import voice conductor (will be available after API starts)
try:
    from sintraprime.voice.conductor import say
except:
    def say(persona, text):
        print(f"[{persona}] {text}")

def _already_emitted(case_id: str, event: str) -> bool:
    """Check if escalation already fired"""
    conn = connect()
    cur = conn.cursor()
    cur.execute(
        "SELECT 1 FROM timelines WHERE case_id=? AND event=? LIMIT 1",
        (case_id, event)
    )
    exists = cur.fetchone() is not None
    conn.close()
    return exists

def _mark(case_id: str, event: str):
    """Mark escalation as fired"""
    conn = connect()
    conn.execute(
        "INSERT INTO timelines(case_id, event, timestamp) VALUES(?, ?, ?)",
        (case_id, event, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def tick():
    """
    Check all active timelines for escalation conditions
    Run this every 15-60 minutes
    
    ESCALATION LADDER:
    - 24h: Advisory narration + draft followup
    - 48h: Sentinel warning + send followup + evidence snapshot
    - 72h: Vault Guardian testimony + certified mail + evidence snapshot
    
    CRITICAL: Escalations generate CONCRETE JOBS that produce consequences
    """
    conn = connect()
    cur = conn.cursor()
    
    # Get all NOTICE_SENT events without responses
    cur.execute(
        "SELECT case_id, timestamp FROM timelines WHERE event='NOTICE_SENT'"
    )
    rows = cur.fetchall()
    conn.close()
    
    now = datetime.now()
    escalations_fired = 0
    
    for case_id, ts in rows:
        sent = datetime.fromisoformat(ts)
        elapsed = now - sent
        hours = elapsed.total_seconds() / 3600
        
        # 72 hour escalation (HIGHEST PRIORITY - GENERATES REAL JOBS)
        if hours >= 72 and not _already_emitted(case_id, "ESCALATION_72H_EMITTED"):
            print(f"[Timeline] ⚠️  72h escalation: {case_id}")
            
            # Create CONCRETE JOBS for enforcement
            emit("CERTIFIED_MAIL_DISPATCH", {"case_id": case_id, "since": ts}, priority=1)
            emit("EVIDENCE_SNAPSHOT", {"case_id": case_id, "since": ts, "level": "72h"}, priority=1)
            
            _mark(case_id, "ESCALATION_72H_EMITTED")
            say("VAULT_GUARDIAN", "Seventy-two hours have elapsed. Escalation initiated.")
            
            escalations_fired += 1
        
        # 48 hour escalation (GENERATES FOLLOWUP + EVIDENCE JOBS)
        elif hours >= 48 and not _already_emitted(case_id, "ESCALATION_48H_EMITTED"):
            print(f"[Timeline] ⚠️  48h escalation: {case_id}")
            
            # Create CONCRETE JOBS
            emit("FOLLOWUP_NOTICE_SEND", {"case_id": case_id, "since": ts}, priority=2)
            emit("EVIDENCE_SNAPSHOT", {"case_id": case_id, "since": ts, "level": "48h"}, priority=2)
            
            _mark(case_id, "ESCALATION_48H_EMITTED")
            say("SENTINEL", "Forty-eight hours elapsed with no acknowledgment.")
            
            escalations_fired += 1
        
        # 24 hour escalation (ADVISORY + DRAFT)
        elif hours >= 24 and not _already_emitted(case_id, "ESCALATION_24H_EMITTED"):
            print(f"[Timeline] ⚠️  24h escalation: {case_id}")
            
            # Create CONCRETE JOB for draft
            emit("FOLLOWUP_NOTICE_DRAFT", {"case_id": case_id, "since": ts}, priority=3)
            
            _mark(case_id, "ESCALATION_24H_EMITTED")
            say("SINTRAPRIME", "Twenty-four hours since notice. Monitoring escalation threshold.")
            
            escalations_fired += 1
    
    if escalations_fired > 0:
        print(f"[Timeline] ✅ Fired {escalations_fired} escalations with concrete jobs")
    
    return escalations_fired

def record_notice(case_id: str, metadata: dict = None):
    """Record a notice being sent (starts the clock)"""
    conn = connect()
    conn.execute(
        "INSERT INTO timelines(case_id, event, timestamp, metadata) VALUES(?, 'NOTICE_SENT', ?, ?)",
        (case_id, datetime.now().isoformat(), str(metadata or {}))
    )
    conn.commit()
    conn.close()
    
    print(f"[Timeline] ✅ Notice recorded: {case_id}")
    emit("TIMELINE_WATCH_START", {"case_id": case_id}, priority=3)
