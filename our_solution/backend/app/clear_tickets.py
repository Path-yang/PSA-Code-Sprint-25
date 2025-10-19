"""Clear all tickets from Neon database."""

import os
import psycopg2

NEON_URL = "postgresql://neondb_owner:npg_RWuA6hPdr3SL@ep-small-violet-a19mtcer-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

conn = psycopg2.connect(NEON_URL)
cursor = conn.cursor()
cursor.execute('DELETE FROM tickets')
deleted = cursor.rowcount
conn.commit()
conn.close()

print(f'✅ Cleared {deleted} tickets from Neon database')

