"""Simple diagnostic endpoint to check Neon tickets."""

from http.server import BaseHTTPRequestHandler
import json
import os
import sys

# Ensure project root is on sys.path
def _ensure_project_root():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..'))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

_ensure_project_root()

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        try:
            from our_solution.backend.app import database
            
            # Get all tickets
            tickets = database.list_tickets(limit=10)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                "status": "ok",
                "database": "Neon Postgres" if database.USE_POSTGRES else "SQLite",
                "ticket_count": len(tickets),
                "tickets": tickets
            }
            
            self.wfile.write(json.dumps(response, indent=2).encode())
        
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            import traceback
            self.wfile.write(json.dumps({
                "error": str(e),
                "traceback": traceback.format_exc()
            }).encode())

