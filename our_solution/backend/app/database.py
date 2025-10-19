"""
Database operations for ticket management.
Supports both SQLite (local dev) and Postgres/Neon (Vercel production).
Thread-safe, auto-initializing.
Production-ready with Singapore timezone and formatted ticket numbers.
"""

import json
import os
from datetime import datetime
from typing import Optional, List, Dict
from threading import Lock
import pytz

# Singapore timezone for accurate timestamps
SGT = pytz.timezone('Asia/Singapore')

# Detect database backend
NEON_URL = os.environ.get('NEONSTORAGE_URL') or os.environ.get('DATABASE_URL')
USE_POSTGRES = bool(NEON_URL and 'postgres' in NEON_URL)

if USE_POSTGRES:
    print(f"🐘 Using Postgres (Neon) database")
    import psycopg2
    import psycopg2.extras
else:
    print("💾 Using SQLite database (local development)")
    import sqlite3
    import shutil
    
    _current_dir = os.path.dirname(__file__)
    _source_db = os.path.join(_current_dir, "..", "tickets.db")
    SCHEMA_PATH = os.path.join(_current_dir, "db_schema.sql")
    
    # Use /tmp on Vercel if filesystem is read-only
    def _get_db_path():
        if os.environ.get('VERCEL') or not os.access(os.path.dirname(_source_db), os.W_OK):
            tmp_db = '/tmp/tickets.db'
            if not os.path.exists(tmp_db) or os.path.getsize(tmp_db) == 0:
                if os.path.exists(_source_db):
                    print(f"Copying database to {tmp_db}")
                    shutil.copy2(_source_db, tmp_db)
            return tmp_db
        return _source_db
    
    DB_PATH = _get_db_path()

# Thread lock for database operations
_db_lock = Lock()


# ============================================================================
# Database Connection Management
# ============================================================================

def _get_postgres_connection():
    """Get Postgres connection."""
    conn = psycopg2.connect(NEON_URL)
    return conn


def _get_sqlite_connection():
    """Get SQLite connection and initialize schema."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    
    # Initialize schema
    with open(SCHEMA_PATH, 'r') as f:
        schema = f.read()
        conn.executescript(schema)
    
    return conn


def _generate_ticket_number():
    """Generate next ticket number in format 0000001, 0000002, etc."""
    if USE_POSTGRES:
        conn = _get_postgres_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT ticket_number FROM tickets ORDER BY id DESC LIMIT 1")
            row = cursor.fetchone()
            
            if row and row[0]:
                last_number = int(row[0])
                next_number = last_number + 1
            else:
                next_number = 1
            
            return f"{next_number:07d}"
        finally:
            conn.close()
    else:
        conn = _get_sqlite_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT ticket_number FROM tickets ORDER BY id DESC LIMIT 1")
            row = cursor.fetchone()
            
            if row and row['ticket_number']:
                last_number = int(row['ticket_number'])
                next_number = last_number + 1
            else:
                next_number = 1
            
            return f"{next_number:07d}"
        finally:
            conn.close()


def _get_singapore_time():
    """Get current time in Singapore timezone."""
    return datetime.now(SGT)


def _init_postgres_schema():
    """Initialize Postgres database schema (idempotent)."""
    try:
        conn = _get_postgres_connection()
        try:
            cursor = conn.cursor()
            
            # Create tickets table (Postgres syntax)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tickets (
                    id SERIAL PRIMARY KEY,
                    ticket_number TEXT UNIQUE NOT NULL,
                    alert_text TEXT NOT NULL,
                    diagnosis_data JSONB NOT NULL,
                    edited_diagnosis JSONB,
                    status TEXT DEFAULT 'active',
                    notes TEXT,
                    custom_fields JSONB DEFAULT '{}',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    closed_at TIMESTAMP WITH TIME ZONE,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number)
            """)
            
            conn.commit()
            print("✅ Postgres schema initialized")
        finally:
            conn.close()
    except Exception as e:
        print(f"⚠️ Postgres schema init: {e}")


# Initialize Postgres schema on module load if using Postgres
if USE_POSTGRES:
    _init_postgres_schema()


# ============================================================================
# Unified CRUD Operations
# ============================================================================

def create_ticket(alert_text: str, diagnosis_data: dict) -> dict:
    """Create a new ticket from diagnostic data with Singapore timezone."""
    with _db_lock:
        ticket_number = _generate_ticket_number()
        now = _get_singapore_time()
        
        if USE_POSTGRES:
            conn = _get_postgres_connection()
            try:
                cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cursor.execute("""
                    INSERT INTO tickets (ticket_number, alert_text, diagnosis_data, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (ticket_number, alert_text, json.dumps(diagnosis_data), now, now))
                
                ticket_id = cursor.fetchone()['id']
                conn.commit()
                return get_ticket(ticket_id)
            except Exception as e:
                print(f"❌ Error creating ticket: {e}")
                raise
            finally:
                conn.close()
        else:
            conn = _get_sqlite_connection()
            try:
                cursor = conn.cursor()
                now_iso = now.isoformat()
                cursor.execute("""
                    INSERT INTO tickets (ticket_number, alert_text, diagnosis_data, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (ticket_number, alert_text, json.dumps(diagnosis_data), now_iso, now_iso))
                
                ticket_id = cursor.lastrowid
                conn.commit()
                return get_ticket(ticket_id)
            except Exception as e:
                print(f"❌ Error creating ticket: {e}")
                raise
            finally:
                conn.close()


def get_ticket(ticket_id: int) -> Optional[dict]:
    """Get a ticket by ID with error handling."""
    try:
        if USE_POSTGRES:
            conn = _get_postgres_connection()
            try:
                cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cursor.execute("SELECT * FROM tickets WHERE id = %s", (ticket_id,))
                row = cursor.fetchone()
                return _parse_ticket(dict(row)) if row else None
            finally:
                conn.close()
        else:
            conn = _get_sqlite_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
                row = cursor.fetchone()
                return _parse_ticket(dict(row)) if row else None
            finally:
                conn.close()
    except Exception as e:
        print(f"❌ Error fetching ticket {ticket_id}: {e}")
        import traceback
        traceback.print_exc()
        return None


def list_tickets(status: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[dict]:
    """List tickets with optional filtering."""
    if USE_POSTGRES:
        conn = _get_postgres_connection()
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            if status:
                cursor.execute("""
                    SELECT * FROM tickets 
                    WHERE status = %s
                    ORDER BY created_at DESC
                    LIMIT %s OFFSET %s
                """, (status, limit, offset))
            else:
                cursor.execute("""
                    SELECT * FROM tickets
                    ORDER BY created_at DESC
                    LIMIT %s OFFSET %s
                """, (limit, offset))
            
            rows = cursor.fetchall()
            return [_parse_ticket(dict(row)) for row in rows]
        finally:
            conn.close()
    else:
        conn = _get_sqlite_connection()
        try:
            cursor = conn.cursor()
            
            if status:
                cursor.execute("""
                    SELECT * FROM tickets 
                    WHERE status = ?
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                """, (status, limit, offset))
            else:
                cursor.execute("""
                    SELECT * FROM tickets
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                """, (limit, offset))
            
            rows = cursor.fetchall()
            return [_parse_ticket(dict(row)) for row in rows]
        finally:
            conn.close()


def update_ticket(ticket_id: int, updates: dict) -> Optional[dict]:
    """Update ticket fields."""
    with _db_lock:
        allowed_fields = {'edited_diagnosis', 'notes', 'custom_fields'}
        fields_to_update = {k: v for k, v in updates.items() if k in allowed_fields}
        
        if not fields_to_update:
            return get_ticket(ticket_id)
        
        # For Postgres, keep as dict; for SQLite, convert to JSON string
        if not USE_POSTGRES:
            for key in ['edited_diagnosis', 'custom_fields']:
                if key in fields_to_update and isinstance(fields_to_update[key], dict):
                    fields_to_update[key] = json.dumps(fields_to_update[key])
        else:
            # For Postgres with JSONB, convert dict to JSON string
            for key in ['edited_diagnosis', 'custom_fields']:
                if key in fields_to_update and isinstance(fields_to_update[key], dict):
                    fields_to_update[key] = json.dumps(fields_to_update[key])
        
        # Add updated_at timestamp (Singapore time)
        fields_to_update['updated_at'] = _get_singapore_time()
        
        if USE_POSTGRES:
            conn = _get_postgres_connection()
            try:
                cursor = conn.cursor()
                set_clause = ', '.join([f"{k} = %s" for k in fields_to_update.keys()])
                values = list(fields_to_update.values()) + [ticket_id]
                
                cursor.execute(f"""
                    UPDATE tickets
                    SET {set_clause}
                    WHERE id = %s
                """, values)
                conn.commit()
            finally:
                conn.close()
        else:
            conn = _get_sqlite_connection()
            try:
                cursor = conn.cursor()
                # Convert datetime to ISO string for SQLite
                if 'updated_at' in fields_to_update:
                    fields_to_update['updated_at'] = fields_to_update['updated_at'].isoformat()
                
                set_clause = ', '.join([f"{k} = ?" for k in fields_to_update.keys()])
                values = list(fields_to_update.values()) + [ticket_id]
                
                cursor.execute(f"""
                    UPDATE tickets
                    SET {set_clause}
                    WHERE id = ?
                """, values)
                conn.commit()
            finally:
                conn.close()
        
        return get_ticket(ticket_id)


def close_ticket(ticket_id: int) -> Optional[dict]:
    """Close a ticket by setting status and closed_at timestamp (Singapore time)."""
    with _db_lock:
        now = _get_singapore_time()
        
        if USE_POSTGRES:
            conn = _get_postgres_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE tickets
                    SET status = 'closed', closed_at = %s, updated_at = %s
                    WHERE id = %s
                """, (now, now, ticket_id))
                conn.commit()
            finally:
                conn.close()
        else:
            conn = _get_sqlite_connection()
            try:
                cursor = conn.cursor()
                now_iso = now.isoformat()
                cursor.execute("""
                    UPDATE tickets
                    SET status = 'closed', closed_at = ?, updated_at = ?
                    WHERE id = ?
                """, (now_iso, now_iso, ticket_id))
                conn.commit()
            finally:
                conn.close()
        
        return get_ticket(ticket_id)


def delete_ticket(ticket_id: int) -> bool:
    """Delete a ticket (for testing/cleanup)."""
    with _db_lock:
        if USE_POSTGRES:
            conn = _get_postgres_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM tickets WHERE id = %s", (ticket_id,))
                rows_affected = cursor.rowcount
                conn.commit()
                return rows_affected > 0
            finally:
                conn.close()
        else:
            conn = _get_sqlite_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
                conn.commit()
                return cursor.rowcount > 0
            finally:
                conn.close()


def _parse_ticket(row: dict) -> dict:
    """Parse JSON fields in ticket row."""
    ticket = dict(row)
    
    # Parse JSON fields (only for SQLite, Postgres JSONB returns dict automatically)
    if not USE_POSTGRES:
        if ticket.get('diagnosis_data') and isinstance(ticket['diagnosis_data'], str):
            ticket['diagnosis_data'] = json.loads(ticket['diagnosis_data'])
        
        if ticket.get('edited_diagnosis') and isinstance(ticket['edited_diagnosis'], str):
            ticket['edited_diagnosis'] = json.loads(ticket['edited_diagnosis'])
        
        if ticket.get('custom_fields') and isinstance(ticket['custom_fields'], str):
            ticket['custom_fields'] = json.loads(ticket['custom_fields'])
    
    # Convert timestamps to ISO strings for JSON serialization
    for key in ['created_at', 'closed_at', 'updated_at']:
        if key in ticket and ticket[key]:
            if isinstance(ticket[key], datetime):
                ticket[key] = ticket[key].isoformat()
    
    return ticket
