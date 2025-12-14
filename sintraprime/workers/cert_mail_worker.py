"""
Certified Mail Worker
Handles CERTIFIED_MAIL_DISPATCH jobs

Pulls jobs from Primary, dispatches certified mail, reports completion.
"""

import os
import time
import requests
import traceback
from datetime import datetime

PRIMARY = os.getenv("SINTRA_PRIMARY", "http://127.0.0.1:7777")
WORKER_ID = os.getenv("WORKER_ID", "certmail-01")
CAN_HANDLE = "CERTIFIED_MAIL_DISPATCH"

def submit_certified_mail(case_id: str) -> dict:
    """
    Submit certified mail via Click2Mail API
    
    Phase 2: Replace with real Click2Mail REST API call
    https://developers.click2mail.com/
    
    Example:
        POST https://rest.click2mail.com/molpro/v2/jobs
        Headers: X-API-KEY, X-API-SECRET
        Body: {documents, addresses, options}
    """
    # Demo: simulate mail submission
    result = {
        "provider": "CLICK2MAIL",
        "provider_job_id": f"demo-{case_id}-{int(datetime.now().timestamp())}",
        "status": "SUBMITTED",
        "tracking_number": f"USPS-{case_id}-{int(datetime.now().timestamp())}"
    }
    
    print(f"[CertMail] 📮 Submitted: {case_id} → {result['tracking_number']}")
    
    # Phase 2: Store tracking in database
    # conn = connect()
    # conn.execute("INSERT INTO certified_mail(case_id, tracking_number, provider, status, mailed_at) VALUES(?,?,?,?,?)", ...)
    
    return result

def post_complete(job_id: int, status: str, result: dict):
    """Report job completion to Primary"""
    requests.post(f"{PRIMARY}/job/complete", json={
        "job_id": job_id,
        "worker_id": WORKER_ID,
        "status": status,
        "result": result
    }, timeout=30).raise_for_status()

def post_event(event_type: str, payload: dict, priority: int = 1):
    """Post completion event to Primary"""
    requests.post(f"{PRIMARY}/event", json={
        "event_type": event_type,
        "payload": payload,
        "priority": priority
    }, timeout=30).raise_for_status()

def loop():
    """Main worker loop"""
    print(f"[CertMail] Starting certified mail worker: {WORKER_ID}")
    print(f"[CertMail] Can handle: {CAN_HANDLE}")
    print(f"[CertMail] Primary API: {PRIMARY}")
    print("")
    
    while True:
        try:
            # Claim next CERTIFIED_MAIL_DISPATCH job
            job = requests.get(f"{PRIMARY}/job/next",
                               params={"worker_id": WORKER_ID, "types": CAN_HANDLE},
                               timeout=20).json()
            
            if not job:
                # No jobs available
                time.sleep(2)
                continue

            job_id = job["id"]
            case_id = job["payload"]["case_id"]
            
            print(f"[CertMail] 🔧 Claimed job #{job_id} for case {case_id}")

            try:
                # Submit certified mail
                result = submit_certified_mail(case_id)
                
                # Report completion
                post_complete(job_id, "COMPLETED", {"ok": True, "case_id": case_id, **result})
                
                # Emit completion event (triggers Vault Guardian testimony)
                post_event("CERTIFIED_MAIL_SUBMITTED", {"case_id": case_id, **result}, priority=1)
                
                print(f"[CertMail] ✅ Completed job #{job_id} for {case_id}")
                
            except Exception as e:
                print(f"[CertMail] ❌ Failed job #{job_id}: {e}")
                post_complete(job_id, "FAILED", {"ok": False, "case_id": case_id, "error": str(e)})
        
        except requests.exceptions.Timeout:
            print(f"[CertMail] ⏱️  Timeout connecting to Primary, retrying...")
            time.sleep(5)
        except requests.exceptions.ConnectionError:
            print(f"[CertMail] ❌ Connection error to Primary, retrying...")
            time.sleep(5)
        except Exception as e:
            print(f"[CertMail] ❌ Error: {e}")
            traceback.print_exc()
            time.sleep(3)

if __name__ == "__main__":
    loop()
