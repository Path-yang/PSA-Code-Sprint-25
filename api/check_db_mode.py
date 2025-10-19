"""
Check which database mode is being used on Vercel
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    from our_solution.backend.app import database
    
    class handler(BaseHTTPRequestHandler):
        def do_GET(self):
            """Check database configuration"""
            try:
                info = {
                    "database_mode": "Postgres" if database.USE_POSTGRES else "SQLite",
                    "database_url_set": bool(os.environ.get('DATABASE_URL')),
                    "database_url_value": os.environ.get('DATABASE_URL', 'NOT SET')[:50] + '...' if os.environ.get('DATABASE_URL') else None,
                    "neon_url_set": bool(os.environ.get('NEONSTORAGE_URL')),
                    "is_vercel": bool(os.environ.get('VERCEL')),
                    "ticket_count": len(database.list_tickets()),
                    "all_tickets": database.list_tickets()
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(info, indent=2, default=str).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}, indent=2).encode())
except Exception as e:
    class handler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"Failed to import: {e}"}, indent=2).encode())

