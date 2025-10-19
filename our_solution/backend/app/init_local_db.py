"""Initialize local SQLite database with new schema."""

import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "..", "tickets.db")
schema_path = os.path.join(os.path.dirname(__file__), "db_schema.sql")

print(f"📁 Creating SQLite database at: {db_path}")

# Read schema
with open(schema_path, 'r') as f:
    schema = f.read()

# Create database
conn = sqlite3.connect(db_path)
conn.executescript(schema)
conn.close()

print("✅ Local SQLite database created successfully!")
print("   - ticket_number column added")
print("   - All indexes created")
print("   - Ready for local testing")

