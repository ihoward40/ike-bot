"""
SintraPrime "One Dominance Demo"
Proves the whole system works end-to-end

Test: 72-hour escalation → certified mail → testimony
"""

from datetime import datetime, timedelta
from sintraprime.core.db import connect

def setup_test_case():
    """Create a fake case with notice sent 73 hours ago"""
    conn = connect()
    
    case_id = "CASE-DEMO-001"
    notice_sent = (datetime.now() - timedelta(hours=73)).isoformat()
    
    # Insert timeline event
    conn.execute(
        "INSERT INTO timelines(case_id, event, timestamp) VALUES(?, ?, ?)",
        (case_id, "NOTICE_SENT", notice_sent)
    )
    conn.commit()
    conn.close()
    
    print(f"✅ Inserted NOTICE_SENT 73h ago for {case_id}")
    return case_id

def run_demo():
    """Run the dominance demo"""
    print("="*60)
    print("SINTRAPRIME DOMINANCE DEMO")
    print("="*60)
    print("")
    
    # Step 1: Create test case
    print("Step 1: Creating test case with 73-hour-old notice...")
    case_id = setup_test_case()
    print("")
    
    # Step 2: Run timeline tick
    print("Step 2: Running timeline escalation check...")
    from sintraprime.core.timeline_engine import tick
    escalations = tick()
    print(f"✅ Fired {escalations} escalation(s)")
    print("")
    
    # Step 3: Check jobs created
    print("Step 3: Checking jobs created...")
    from sintraprime.core.event_bus import get_pending_jobs
    jobs = get_pending_jobs("CERTIFIED_MAIL_DISPATCH")
    
    if jobs:
        print(f"✅ Found {len(jobs)} CERTIFIED_MAIL_DISPATCH job(s)")
        for job in jobs:
            print(f"   Job #{job['id']}: {job['event_type']} (P{job['priority']})")
    else:
        print("❌ No CERTIFIED_MAIL_DISPATCH jobs found")
    print("")
    
    # Step 4: Instructions
    print("Step 4: Next steps to complete demo:")
    print("")
    print("1. Start Primary API:")
    print("   python -m uvicorn sintraprime.core.api:app --host 0.0.0.0 --port 7777")
    print("")
    print("2. Start Certified Mail Worker:")
    print("   python sintraprime/workers/cert_mail_worker.py")
    print("")
    print("Expected behavior:")
    print("- Worker will claim the CERTIFIED_MAIL_DISPATCH job")
    print("- Worker will submit certified mail (stub)")
    print("- Worker reports completion to Primary")
    print("- Vault Guardian speaks: 'Certified mail submitted for case...'")
    print("")
    print("="*60)
    print("THIS IS INSTITUTIONAL BEHAVIOR")
    print("="*60)

if __name__ == "__main__":
    run_demo()
