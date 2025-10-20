#!/usr/bin/env python3
"""
Migration script to update all tickets with module "EDI" to "EDI/API"
"""
import json
from app.database import get_ticket, _db_lock, USE_POSTGRES, _get_postgres_connection, _get_sqlite_connection, _get_singapore_time

def update_edi_to_edi_api():
    """Update all tickets with EDI module to EDI/API"""
    print("🔄 Updating tickets with module 'EDI' to 'EDI/API'...")
    
    updated_count = 0
    
    with _db_lock:
        if USE_POSTGRES:
            conn = _get_postgres_connection()
            try:
                cursor = conn.cursor()
                # Get all tickets with EDI module
                cursor.execute("""
                    SELECT id, ticket_number, diagnosis_data, edited_diagnosis 
                    FROM tickets
                    WHERE diagnosis_data::text LIKE '%"module": "EDI"%'
                       OR edited_diagnosis::text LIKE '%"module": "EDI"%'
                """)
                tickets = cursor.fetchall()
                
                for row in tickets:
                    ticket_id, ticket_number, diagnosis_data, edited_diagnosis = row
                    
                    # Update diagnosis_data
                    if diagnosis_data and '"module": "EDI"' in json.dumps(diagnosis_data):
                        if diagnosis_data.get('parsed', {}).get('module') == 'EDI':
                            print(f"  ✓ Updating ticket #{ticket_number} ({ticket_id})")
                            diagnosis_data['parsed']['module'] = 'EDI/API'
                            
                            cursor.execute("""
                                UPDATE tickets 
                                SET diagnosis_data = %s, updated_at = %s, update_reason = %s
                                WHERE id = %s
                            """, (json.dumps(diagnosis_data), _get_singapore_time(), 'Module name updated', ticket_id))
                            updated_count += 1
                    
                    # Update edited_diagnosis if exists
                    if edited_diagnosis and '"module": "EDI"' in json.dumps(edited_diagnosis):
                        if edited_diagnosis.get('parsed', {}).get('module') == 'EDI':
                            print(f"  ✓ Updating edited diagnosis for ticket #{ticket_number} ({ticket_id})")
                            edited_diagnosis['parsed']['module'] = 'EDI/API'
                            
                            cursor.execute("""
                                UPDATE tickets 
                                SET edited_diagnosis = %s, updated_at = %s, update_reason = %s
                                WHERE id = %s
                            """, (json.dumps(edited_diagnosis), _get_singapore_time(), 'Module name updated', ticket_id))
                            updated_count += 1
                
                conn.commit()
            finally:
                conn.close()
        else:
            # SQLite
            conn = _get_sqlite_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT id, ticket_number, diagnosis_data, edited_diagnosis FROM tickets")
                tickets = cursor.fetchall()
                
                for row in tickets:
                    ticket_id, ticket_number, diagnosis_data_str, edited_diagnosis_str = row
                    
                    # Parse JSON strings
                    diagnosis_data = json.loads(diagnosis_data_str) if diagnosis_data_str else {}
                    edited_diagnosis = json.loads(edited_diagnosis_str) if edited_diagnosis_str else {}
                    
                    # Update diagnosis_data
                    if diagnosis_data.get('parsed', {}).get('module') == 'EDI':
                        print(f"  ✓ Updating ticket #{ticket_number} ({ticket_id})")
                        diagnosis_data['parsed']['module'] = 'EDI/API'
                        
                        cursor.execute("""
                            UPDATE tickets 
                            SET diagnosis_data = ?, updated_at = ?, update_reason = ?
                            WHERE id = ?
                        """, (json.dumps(diagnosis_data), _get_singapore_time().isoformat(), 'Module name updated', ticket_id))
                        updated_count += 1
                    
                    # Update edited_diagnosis if exists
                    if edited_diagnosis and edited_diagnosis.get('parsed', {}).get('module') == 'EDI':
                        print(f"  ✓ Updating edited diagnosis for ticket #{ticket_number} ({ticket_id})")
                        edited_diagnosis['parsed']['module'] = 'EDI/API'
                        
                        cursor.execute("""
                            UPDATE tickets 
                            SET edited_diagnosis = ?, updated_at = ?, update_reason = ?
                            WHERE id = ?
                        """, (json.dumps(edited_diagnosis), _get_singapore_time().isoformat(), 'Module name updated', ticket_id))
                        updated_count += 1
                
                conn.commit()
            finally:
                conn.close()
    
    print(f"\n✅ Migration complete! Updated {updated_count} occurrence(s)")

if __name__ == '__main__':
    update_edi_to_edi_api()

