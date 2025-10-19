"""
Vercel serverless function to migrate database schema
Run this once to add deletion_reason and deleted_at columns
"""
import os
import sys
import json
from http.server import BaseHTTPRequestHandler

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'our_solution', 'backend'))

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Run database migration"""
        try:
            database_url = os.environ.get('DATABASE_URL')
            
            if not database_url:
                self._send_error(500, "DATABASE_URL not configured")
                return
            
            if not psycopg2:
                self._send_error(500, "psycopg2 not available")
                return
            
            # Connect to database
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Check current columns
            cursor.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns 
                WHERE table_name = 'tickets'
                ORDER BY ordinal_position
            """)
            existing_columns = {row['column_name']: row['data_type'] for row in cursor.fetchall()}
            
            migrations_applied = []
            
            # Add deletion_reason if missing
            if 'deletion_reason' not in existing_columns:
                cursor.execute("ALTER TABLE tickets ADD COLUMN deletion_reason TEXT")
                migrations_applied.append("Added deletion_reason column")
            
            # Add deleted_at if missing
            if 'deleted_at' not in existing_columns:
                cursor.execute("ALTER TABLE tickets ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE")
                migrations_applied.append("Added deleted_at column")
            
            if migrations_applied:
                conn.commit()
                message = "Migration completed successfully"
            else:
                message = "No migration needed - all columns exist"
            
            # Get updated column list
            cursor.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns 
                WHERE table_name = 'tickets'
                ORDER BY ordinal_position
            """)
            final_columns = [
                {"name": row['column_name'], "type": row['data_type']} 
                for row in cursor.fetchall()
            ]
            
            conn.close()
            
            self._send_json(200, {
                "success": True,
                "message": message,
                "migrations_applied": migrations_applied,
                "columns": final_columns
            })
            
        except Exception as e:
            self._send_error(500, str(e))
    
    def _send_json(self, status_code, data):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())
    
    def _send_error(self, status_code, message):
        """Send error response"""
        self._send_json(status_code, {
            "success": False,
            "error": message
        })

