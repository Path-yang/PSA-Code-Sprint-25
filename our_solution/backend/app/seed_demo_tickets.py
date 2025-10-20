"""
Seed demo tickets for hackathon judges to evaluate.
Run this script to populate the database with example tickets.
"""

from datetime import datetime, timedelta
from database import create_ticket, close_ticket, update_ticket


def seed_demo_data():
    """Create demo tickets showing various scenarios."""
    
    print("🌱 Seeding demo tickets...")
    
    # Demo Ticket 1: Active - Container duplicate issue (from test case)
    ticket1_alert = """RE: Email ALR-861600 | CMAU0000020 - Duplicate Container information received

Hi team,

Please assist in checking container CMAU0000020. Customer on PORTNET is seeing 2
identical containers information.

Thanks.
Regards,
Kenny"""
    
    ticket1_diagnosis = {
        "parsed": {
            "ticket_id": "ALR-861600",
            "module": "Container",
            "entity_id": "CMAU0000020",
            "channel": "Email",
            "priority": "Medium",
            "symptoms": ["duplicate", "container", "information"]
        },
        "root_cause": {
            "root_cause": "Duplicate container records in database",
            "technical_details": "Multiple EDI messages processed for same container",
            "confidence": 85,
            "evidence_summary": ["Found duplicate entries in container_service.log"]
        },
        "resolution": {
            "resolution_steps": [
                "Query database for duplicate container entries",
                "Identify source EDI messages",
                "Remove duplicate record",
                "Verify with customer"
            ],
            "estimated_time": "30 minutes",
            "escalate": False,
            "verification_steps": ["Check PORTNET display", "Confirm with customer"],
            "sql_queries": ["SELECT * FROM containers WHERE container_no = 'CMAU0000020'"]
        },
        "report": "# Diagnostic Report for ALR-861600\n\n## Issue\nDuplicate container information...",
        "log_evidence": [],
        "kb_articles": [],
        "similar_cases": []
    }
    
    ticket1 = create_ticket(ticket1_alert, ticket1_diagnosis)
    print(f"   ✓ Created active ticket #{ticket1['id']}: Container Duplicate")
    
    # Demo Ticket 2: Closed - EDI message stuck (resolved)
    ticket2_alert = """Test Case 3 (SMS Received on Duty Phone)
Alert: SMS INC-154599
Issue: EDI message REF=IFT-0007 stuck in ERROR status (Sender: LINE-PSA,
Recipient: PSA-TOS, State: No acknowledgment sent, ack_at is NULL)."""
    
    ticket2_diagnosis = {
        "parsed": {
            "ticket_id": "INC-154599",
            "module": "EDI/API",
            "entity_id": "IFT-0007",
            "channel": "SMS",
            "priority": "High",
            "symptoms": ["stuck", "ERROR", "acknowledgment"]
        },
        "root_cause": {
            "root_cause": "EDI acknowledgment not sent",
            "technical_details": "ack_at field is NULL indicating timeout",
            "confidence": 90,
            "evidence_summary": ["EDI message in ERROR state", "No acknowledgment timestamp"]
        },
        "resolution": {
            "resolution_steps": [
                "Check EDI message status in database",
                "Resend acknowledgment",
                "Update ack_at timestamp",
                "Monitor for success"
            ],
            "estimated_time": "15 minutes",
            "escalate": False,
            "verification_steps": ["Verify message state changed to SUCCESS"],
            "sql_queries": ["UPDATE edi_messages SET ack_at = NOW() WHERE ref = 'IFT-0007'"]
        },
        "report": "# Diagnostic Report for INC-154599\n\n## Issue\nEDI message stuck...",
        "log_evidence": [],
        "kb_articles": [],
        "similar_cases": []
    }
    
    ticket2 = create_ticket(ticket2_alert, ticket2_diagnosis)
    
    # Add some custom notes
    update_ticket(ticket2['id'], {
        "notes": "Successfully resolved by resending ACK. Customer confirmed fix.",
        "custom_fields": {"resolved_by": "L2 Team", "customer_notified": "Yes"}
    })
    
    # Close this ticket (simulate 2 hours to resolve)
    close_ticket(ticket2['id'])
    print(f"   ✓ Created closed ticket #{ticket2['id']}: EDI Message Error (resolved)")
    
    # Demo Ticket 3: Active - Vessel not found
    ticket3_alert = """Test Case 2 (Call Notes)
Caller: Port Customer Service
Issue: Vessel OCEANIA cannot be found in system
Details: Customer trying to book berth for OCEANIA arriving tomorrow"""
    
    ticket3_diagnosis = {
        "parsed": {
            "ticket_id": "CALL-" + datetime.now().strftime("%m%d%H%M"),
            "module": "Vessel",
            "entity_id": "OCEANIA",
            "channel": "Call",
            "priority": "High",
            "symptoms": ["vessel", "not found", "berth booking"]
        },
        "root_cause": {
            "root_cause": "Vessel not registered in vessel registry",
            "technical_details": "Missing vessel master data entry",
            "confidence": 95,
            "evidence_summary": ["Vessel not in vessel_registry table"]
        },
        "resolution": {
            "resolution_steps": [
                "Verify vessel details from external source",
                "Create vessel master data entry",
                "Assign IMO number",
                "Enable for berth booking"
            ],
            "estimated_time": "45 minutes",
            "escalate": True,
            "escalate_to": "Vessel Registry Team",
            "verification_steps": ["Search vessel in system", "Test berth booking"],
            "sql_queries": ["INSERT INTO vessels (name, imo, ...) VALUES ('OCEANIA', ...)"]
        },
        "report": "# Diagnostic Report\n\n## Issue\nVessel not found in system...",
        "log_evidence": [],
        "kb_articles": [],
        "similar_cases": []
    }
    
    ticket3 = create_ticket(ticket3_alert, ticket3_diagnosis)
    update_ticket(ticket3['id'], {
        "notes": "Escalated to Vessel Registry Team. Waiting for IMO verification.",
        "custom_fields": {"escalated_to": "Vessel Registry", "priority": "Urgent"}
    })
    print(f"   ✓ Created active ticket #{ticket3['id']}: Vessel Not Found (escalated)")
    
    print(f"\n✅ Created 3 demo tickets (2 active, 1 closed)")
    print(f"   Database location: my_solution/backend/tickets.db")


if __name__ == "__main__":
    seed_demo_data()

