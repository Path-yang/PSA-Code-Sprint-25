import psycopg2

conn = psycopg2.connect('postgresql://neondb_owner:npg_RWuA6hPdr3SL@ep-small-violet-a19mtcer-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require')
cursor = conn.cursor()
cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'tickets' ORDER BY ordinal_position")
print("Current columns in tickets table:")
for row in cursor.fetchall():
    print(f"  - {row[0]}")
conn.close()

