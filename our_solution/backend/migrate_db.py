#!/usr/bin/env python3
"""
Database migration script to add deletion_reason and deleted_at columns
"""
import os
import sys
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor

def migrate_sqlite():
    """Migrate local SQLite database"""
    db_path = os.path.join(os.path.dirname(__file__), 'app', 'tickets.db')
    
    if not os.path.exists(db_path):
        print(f"❌ SQLite database not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(tickets)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'deletion_reason' in columns and 'deleted_at' in columns:
            print("✅ SQLite: Columns already exist, no migration needed")
            conn.close()
            return True
        
        # Add new columns
        print("🔄 SQLite: Adding deletion_reason and deleted_at columns...")
        
        if 'deletion_reason' not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN deletion_reason TEXT")
            print("  ✓ Added deletion_reason column")
        
        if 'deleted_at' not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN deleted_at TEXT")
            print("  ✓ Added deleted_at column")
        
        # Update status column to support 'deleted' if needed
        cursor.execute("SELECT DISTINCT status FROM tickets")
        statuses = [row[0] for row in cursor.fetchall()]
        print(f"  ℹ Current statuses: {statuses}")
        
        conn.commit()
        conn.close()
        
        print("✅ SQLite migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ SQLite migration failed: {e}")
        return False

def migrate_postgres():
    """Migrate Neon Postgres database"""
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        print("⚠️  DATABASE_URL not found in environment variables")
        print("   Skipping Postgres migration (run this on Vercel or with DATABASE_URL set)")
        return True  # Not a failure, just skipped
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if columns already exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'tickets'
        """)
        columns = [row['column_name'] for row in cursor.fetchall()]
        
        if 'deletion_reason' in columns and 'deleted_at' in columns:
            print("✅ Postgres: Columns already exist, no migration needed")
            conn.close()
            return True
        
        # Add new columns
        print("🔄 Postgres: Adding deletion_reason and deleted_at columns...")
        
        if 'deletion_reason' not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN deletion_reason TEXT")
            print("  ✓ Added deletion_reason column")
        
        if 'deleted_at' not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE")
            print("  ✓ Added deleted_at column")
        
        conn.commit()
        conn.close()
        
        print("✅ Postgres migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Postgres migration failed: {e}")
        return False

def main():
    print("=" * 60)
    print("Database Migration Script")
    print("Adding deletion_reason and deleted_at columns")
    print("=" * 60)
    print()
    
    # Migrate SQLite (local)
    sqlite_success = migrate_sqlite()
    print()
    
    # Migrate Postgres (Neon)
    postgres_success = migrate_postgres()
    print()
    
    print("=" * 60)
    if sqlite_success and postgres_success:
        print("✅ All migrations completed successfully!")
        print("=" * 60)
        return 0
    else:
        print("⚠️  Some migrations failed or were skipped")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(main())

