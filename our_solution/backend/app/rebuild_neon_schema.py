"""
Rebuild Neon database schema with ticket_number column.
This will drop and recreate the tickets table.
"""

import os
import psycopg2

NEON_URL = "postgresql://neondb_owner:npg_RWuA6hPdr3SL@ep-small-violet-a19mtcer-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

print("🔧 Rebuilding Neon database schema...")

conn = psycopg2.connect(NEON_URL)
cursor = conn.cursor()

# Drop existing table
print("  ⚠️  Dropping old tickets table...")
cursor.execute('DROP TABLE IF EXISTS tickets CASCADE')

# Create new table with ticket_number
print("  ✨ Creating new tickets table with ticket_number...")
cursor.execute("""
    CREATE TABLE tickets (
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
print("  📊 Creating indexes...")
cursor.execute("CREATE INDEX idx_tickets_status ON tickets(status)")
cursor.execute("CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC)")
cursor.execute("CREATE INDEX idx_tickets_number ON tickets(ticket_number)")

conn.commit()
conn.close()

print("✅ Neon database schema rebuilt successfully!")
print("   - ticket_number column added (7-digit format)")
print("   - All indexes created")
print("   - Database is empty and ready for new tickets")

