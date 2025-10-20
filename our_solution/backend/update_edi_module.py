#!/usr/bin/env python3
"""
Migration script to update all tickets with module "EDI" to "EDI/API"
"""
import json
from app.database import list_tickets, update_ticket

def update_edi_to_edi_api():
    """Update all tickets with EDI module to EDI/API"""
    print("🔄 Updating tickets with module 'EDI' to 'EDI/API'...")
    
    # Get all tickets (active, closed, and deleted)
    all_tickets = []
    all_tickets.extend(list_tickets(status='active', limit=1000))
    all_tickets.extend(list_tickets(status='closed', limit=1000))
    all_tickets.extend(list_tickets(status='deleted', limit=1000))
    
    updated_count = 0
    
    for ticket in all_tickets:
        # Check if diagnosis data has module set to "EDI"
        diagnosis_data = ticket.get('diagnosis_data', {})
        parsed = diagnosis_data.get('parsed', {})
        
        if parsed.get('module') == 'EDI':
            print(f"  ✓ Updating ticket #{ticket['ticket_number']} ({ticket['id']})")
            
            # Update the module
            parsed['module'] = 'EDI/API'
            diagnosis_data['parsed'] = parsed
            
            # Update ticket in database
            update_ticket(ticket['id'], {
                'diagnosis_data': diagnosis_data
            })
            updated_count += 1
        
        # Also check edited_diagnosis if it exists
        edited_diagnosis = ticket.get('edited_diagnosis', {})
        if edited_diagnosis:
            edited_parsed = edited_diagnosis.get('parsed', {})
            if edited_parsed.get('module') == 'EDI':
                print(f"  ✓ Updating edited diagnosis for ticket #{ticket['ticket_number']} ({ticket['id']})")
                edited_parsed['module'] = 'EDI/API'
                edited_diagnosis['parsed'] = edited_parsed
                
                update_ticket(ticket['id'], {
                    'edited_diagnosis': edited_diagnosis
                })
                updated_count += 1
    
    print(f"\n✅ Migration complete! Updated {updated_count} ticket(s)")

if __name__ == '__main__':
    update_edi_to_edi_api()

