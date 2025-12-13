"""
SintraPrime Event Bus
Delegation Backbone - Every meaningful event becomes a job

RULE: SintraPrime does not do work directly. It emits events.
"""

import json
import sqlite3
from datetime import datetime
from .db import connect

def emit(event_type: str, payload: dict, priority: int = 3) -> int:
    """
    Emit an event to the job queue
    
    Args:
        event_type: Type of event (NOTICE_SENT, ESCALATION_72H, etc.)
        payload: Event data (will be JSON serialized)
        priority: 1=highest (Sentinel), 5=lowest
        
    Returns:
        Job ID
    """
    conn = connect()
    cur = conn.cursor()
    
    cur.execute(
        """INSERT INTO jobs(event_type, payload, status, priority, created_at)
           VALUES(?, ?, 'PENDING', ?, ?)""",
        (event_type, json.dumps(payload), priority, datetime.now().isoformat())
    )
    
    job_id = cur.lastrowid
    conn.commit()
    conn.close()
    
    print(f"[Event Bus] ✅ Emitted: {event_type} (Job #{job_id}, P{priority})")
    
    return job_id

def get_pending_jobs(event_type: str = None, limit: int = 10) -> list:
    """Get pending jobs from queue"""
    conn = connect()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    if event_type:
        cur.execute(
            """SELECT * FROM jobs
            WHERE event_type=? AND status='PENDING'
            ORDER BY priority ASC, created_at ASC
            LIMIT ?""",
            (event_type, limit)
        )
    else:
        cur.execute(
            """SELECT * FROM jobs
            WHERE status='PENDING'
            ORDER BY priority ASC, created_at ASC
            LIMIT ?""",
            (limit,)
        )
    
    jobs = [dict(row) for row in cur.fetchall()]
    conn.close()
    
    return jobs

# Common event types
EVENT_TYPES = {
    # Timeline events
    'NOTICE_SENT': 'Legal notice transmitted',
    'RESPONSE_RECEIVED': 'Response from recipient',
    
    # Escalation events
    'ESCALATION_24H': '24 hours elapsed',
    'ESCALATION_48H': '48 hours elapsed',
    'ESCALATION_72H': '72 hours elapsed',
    
    # Work events (concrete jobs)
    'FOLLOWUP_NOTICE_DRAFT': 'Draft followup notice',
    'FOLLOWUP_NOTICE_SEND': 'Send followup notice',
    'EVIDENCE_SNAPSHOT': 'Create evidence snapshot',
    'CERTIFIED_MAIL_DISPATCH': 'Send certified mail',
    'DOCUMENT_GENERATION': 'Generate PDF',
    'EMAIL_DISPATCH': 'Send email',
    
    # Completion events
    'CERTIFIED_MAIL_SUBMITTED': 'Certified mail submitted',
    'WEEKLY_BRIEFING': 'Generate weekly briefing',
    'WEEKLY_BRIEFING_READY': 'Briefing ready to speak',
    
    # Integration events
    'NOTION_UPDATE': 'Update Notion database',
    'NOTION_CASE_UPDATED': 'Case updated in Notion'
}
