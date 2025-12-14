"""
SintraPrime Worker Runner
Real job-pulling loop + handler routing

This worker claims jobs from Primary and executes them.
"""

import os
import time
import requests
import traceback
import json

PRIMARY = os.getenv("SINTRA_PRIMARY", "http://127.0.0.1:7777")
WORKER_ID = os.getenv("WORKER_ID", "worker-01")

# Tell Primary what job types you can handle:
CAN_HANDLE = os.getenv("CAN_HANDLE", "FOLLOWUP_NOTICE_DRAFT,FOLLOWUP_NOTICE_SEND,EVIDENCE_SNAPSHOT").strip()

def post_complete(job_id: int, status: str, result: dict):
    """Report job completion to Primary"""
    payload = {"job_id": job_id, "worker_id": WORKER_ID, "status": status, "result": result}
    requests.post(f"{PRIMARY}/job/complete", json=payload, timeout=30).raise_for_status()
    print(f"[Worker] ✅ Reported job #{job_id} as {status}")

def handle_job(event_type: str, payload: dict) -> dict:
    """
    Route job types to handlers
    
    Add more handlers here as you build out workers
    """
    case_id = payload.get("case_id", "UNKNOWN")
    
    if event_type == "EVIDENCE_SNAPSHOT":
        # Phase 2: Create actual evidence snapshot (hash files, generate PDF, archive)
        level = payload.get("level", "unknown")
        print(f"[Worker] 📸 Evidence snapshot for {case_id} ({level})")
        return {
            "ok": True,
            "case_id": case_id,
            "level": level,
            "note": "Evidence snapshot queued (stub). Wire archiving next."
        }

    if event_type == "FOLLOWUP_NOTICE_DRAFT":
        # Phase 2: Generate actual PDF draft
        print(f"[Worker] 📝 Drafting followup notice for {case_id}")
        return {
            "ok": True,
            "case_id": case_id,
            "draft_path": f"C:\\SintraPrime\\evidence\\draft_{case_id}.pdf",
            "note": "Generated follow-up notice draft (stub). Wire PDF generator next."
        }

    if event_type == "FOLLOWUP_NOTICE_SEND":
        # Phase 2: Actually send via Gmail/SMTP
        print(f"[Worker] 📧 Sending followup notice for {case_id}")
        return {
            "ok": True,
            "case_id": case_id,
            "sent": False,
            "note": "Send stub: Wire Gmail API/SMTP next."
        }

    # Unknown job type
    return {"ok": False, "error": f"No handler for event_type={event_type}"}

def loop():
    """Main worker loop"""
    print(f"[Worker] Starting worker: {WORKER_ID}")
    print(f"[Worker] Can handle: {CAN_HANDLE}")
    print(f"[Worker] Primary API: {PRIMARY}")
    print("")
    
    while True:
        try:
            # Claim next job from Primary
            r = requests.get(
                f"{PRIMARY}/job/next",
                params={"worker_id": WORKER_ID, "types": CAN_HANDLE},
                timeout=20
            )
            r.raise_for_status()
            job = r.json()

            if not job:
                # No jobs available, wait
                time.sleep(2)
                continue

            job_id = job["id"]
            event_type = job["event_type"]
            payload = job["payload"]

            print(f"[Worker] 🔧 Claimed job #{job_id}: {event_type}")

            # Execute handler
            result = handle_job(event_type, payload)
            status = "COMPLETED" if result.get("ok") else "FAILED"
            
            # Report completion
            post_complete(job_id, status, result)

        except requests.exceptions.Timeout:
            print(f"[Worker] ⏱️  Timeout connecting to Primary, retrying...")
            time.sleep(5)
        except requests.exceptions.ConnectionError:
            print(f"[Worker] ❌ Connection error to Primary, retrying...")
            time.sleep(5)
        except Exception as e:
            # If the worker itself errors, it should keep running
            print(f"[Worker] ❌ Error: {e}")
            traceback.print_exc()
            time.sleep(3)

if __name__ == "__main__":
    loop()
