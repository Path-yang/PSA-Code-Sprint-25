#!/usr/bin/env python3
"""
Direct Neon migration script
Run this with your DATABASE_URL to add missing columns
"""
import os
import sys

# Prompt for DATABASE_URL if not in environment
database_url = os.environ.get('DATABASE_URL')

if not database_url:
    print("=" * 70)
    print("🔐 DATABASE_URL Required")
    print("=" * 70)
    print("\nPlease enter your Neon Postgres DATABASE_URL:")
    print("(It should look like: postgresql://user:pass@host/db)")
    print()
    database_url = input("DATABASE_URL: ").strip()
    print()

if not database_url:
    print("❌ No DATABASE_URL provided. Exiting.")
    sys.exit(1)

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("❌ psycopg2 not installed!")
    print("   Run: pip install psycopg2-binary")
    sys.exit(1)

print("=" * 70)
print("🔄 Running Database Migration")
print("=" * 70)
print()

try:
    # Connect to Neon
    print("📡 Connecting to Neon Postgres...")
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    print("✅ Connected successfully!")
    print()
    
    # Check existing columns
    print("🔍 Checking current schema...")
    cursor.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'tickets'
        ORDER BY ordinal_position
    """)
    columns = {row['column_name']: row['data_type'] for row in cursor.fetchall()}
    print(f"   Found {len(columns)} columns")
    print()
    
    migrations_applied = []
    
    # Add deletion_reason
    if 'deletion_reason' not in columns:
        print("➕ Adding deletion_reason column...")
        cursor.execute("ALTER TABLE tickets ADD COLUMN deletion_reason TEXT")
        migrations_applied.append("deletion_reason")
        print("   ✅ Added!")
    else:
        print("✓  deletion_reason already exists")
    
    # Add deleted_at
    if 'deleted_at' not in columns:
        print("➕ Adding deleted_at column...")
        cursor.execute("ALTER TABLE tickets ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE")
        migrations_applied.append("deleted_at")
        print("   ✅ Added!")
    else:
        print("✓  deleted_at already exists")
    
    print()
    
    if migrations_applied:
        print("💾 Committing changes...")
        conn.commit()
        print("✅ Migration completed successfully!")
        print(f"   Applied: {', '.join(migrations_applied)}")
    else:
        print("✅ No migration needed - all columns already exist!")
    
    # Show final schema
    print()
    print("📋 Final Schema:")
    cursor.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'tickets'
        ORDER BY ordinal_position
    """)
    for row in cursor.fetchall():
        print(f"   - {row['column_name']}: {row['data_type']}")
    
    conn.close()
    print()
    print("=" * 70)
    print("🎉 All done! You can now delete tickets on your live site.")
    print("=" * 70)
    
except Exception as e:
    print()
    print("=" * 70)
    print(f"❌ Migration failed: {e}")
    print("=" * 70)
    sys.exit(1)

