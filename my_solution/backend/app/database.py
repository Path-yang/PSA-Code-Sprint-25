"""
SQLite database operations for ticket management.
Thread-safe, auto-initializing, works on local and Vercel.
"""

import sqlite3
import json
import os
import shutil
from datetime import datetime
from typing import Optional, List, Dict
from threading import Lock

# Database file locations
_current_dir = os.path.dirname(__file__)
_source_db = os.path.join(_current_dir, "..", "tickets.db")
SCHEMA_PATH = os.path.join(_current_dir, "db_schema.sql")

# Detect Vercel environment and use /tmp for writable storage
def _get_db_path():
    """Get the appropriate database path for the environment."""
    # Check if we're on Vercel (read-only filesystem except /tmp)
    if os.environ.get('VERCEL') or not os.access(os.path.dirname(_source_db), os.W_OK):
        # Use /tmp on Vercel
        tmp_db = '/tmp/tickets.db'
        
        # Copy source database to /tmp if it doesn't exist or is empty
        if not os.path.exists(tmp_db) or os.path.getsize(tmp_db) == 0:
            if os.path.exists(_source_db):
                print(f"Copying database from {_source_db} to {tmp_db}")
                shutil.copy2(_source_db, tmp_db)
            else:
                print(f"Source database not found, will create new at {tmp_db}")
        
        return tmp_db
    else:
        # Local development - use the source database directly
        return _source_db

DB_PATH = _get_db_path()

# Thread lock for database operations
_db_lock = Lock()


def _get_connection():
    """Get a database connection and ensure schema is initialized."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    
    # Initialize schema if needed
    with open(SCHEMA_PATH, 'r') as f:
        schema = f.read()
        conn.executescript(schema)
    
    return conn


def create_ticket(alert_text: str, diagnosis_data: dict) -> dict:
    """
    Create a new ticket from diagnostic data.
    
    Args:
        alert_text: Original alert text
        diagnosis_data: Full diagnosis result from diagnostic_system
    
    Returns:
        Created ticket as dictionary
    """
    with _db_lock:
        conn = _get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO tickets (alert_text, diagnosis_data)
                VALUES (?, ?)
            """, (alert_text, json.dumps(diagnosis_data)))
            
            ticket_id = cursor.lastrowid
            conn.commit()
            
            # Fetch and return the created ticket
            return get_ticket(ticket_id)
        finally:
            conn.close()


def get_ticket(ticket_id: int) -> Optional[dict]:
    """Get a ticket by ID."""
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        row = cursor.fetchone()
        
        if row:
            return _row_to_dict(row)
        return None
    finally:
        conn.close()


def list_tickets(status: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[dict]:
    """
    List tickets with optional filtering.
    
    Args:
        status: Filter by status ('active', 'closed', or None for all)
        limit: Maximum number of tickets to return
        offset: Number of tickets to skip (for pagination)
    
    Returns:
        List of ticket dictionaries
    """
    conn = _get_connection()
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
        return [_row_to_dict(row) for row in rows]
    finally:
        conn.close()


def update_ticket(ticket_id: int, updates: dict) -> Optional[dict]:
    """
    Update ticket fields.
    
    Args:
        ticket_id: ID of ticket to update
        updates: Dictionary of fields to update (edited_diagnosis, notes, custom_fields)
    
    Returns:
        Updated ticket or None if not found
    """
    with _db_lock:
        conn = _get_connection()
        try:
            # Build update query dynamically
            allowed_fields = {'edited_diagnosis', 'notes', 'custom_fields'}
            fields_to_update = {k: v for k, v in updates.items() if k in allowed_fields}
            
            if not fields_to_update:
                return get_ticket(ticket_id)
            
            # Convert dicts to JSON strings
            for key in ['edited_diagnosis', 'custom_fields']:
                if key in fields_to_update and isinstance(fields_to_update[key], dict):
                    fields_to_update[key] = json.dumps(fields_to_update[key])
            
            # Add updated_at timestamp
            fields_to_update['updated_at'] = datetime.utcnow().isoformat()
            
            set_clause = ', '.join([f"{k} = ?" for k in fields_to_update.keys()])
            values = list(fields_to_update.values()) + [ticket_id]
            
            cursor = conn.cursor()
            cursor.execute(f"""
                UPDATE tickets
                SET {set_clause}
                WHERE id = ?
            """, values)
            
            conn.commit()
            
            return get_ticket(ticket_id)
        finally:
            conn.close()


def close_ticket(ticket_id: int) -> Optional[dict]:
    """Close a ticket by setting status and closed_at timestamp."""
    with _db_lock:
        conn = _get_connection()
        try:
            cursor = conn.cursor()
            now = datetime.utcnow().isoformat()
            
            cursor.execute("""
                UPDATE tickets
                SET status = 'closed', closed_at = ?, updated_at = ?
                WHERE id = ?
            """, (now, now, ticket_id))
            
            conn.commit()
            
            return get_ticket(ticket_id)
        finally:
            conn.close()


def delete_ticket(ticket_id: int) -> bool:
    """Delete a ticket (for testing/cleanup)."""
    with _db_lock:
        conn = _get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()


def _row_to_dict(row: sqlite3.Row) -> dict:
    """Convert SQLite row to dictionary and parse JSON fields."""
    ticket = dict(row)
    
    # Parse JSON fields
    if ticket.get('diagnosis_data'):
        ticket['diagnosis_data'] = json.loads(ticket['diagnosis_data'])
    
    if ticket.get('edited_diagnosis'):
        ticket['edited_diagnosis'] = json.loads(ticket['edited_diagnosis'])
    
    if ticket.get('custom_fields'):
        ticket['custom_fields'] = json.loads(ticket['custom_fields'])
    
    return ticket

