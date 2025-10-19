"""Vercel serverless function for ticket management."""

from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import traceback
import re

# Ensure project root is on sys.path for module imports
def _ensure_project_root():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Go from api/ up to repo root
    project_root = os.path.abspath(os.path.join(current_dir, '..'))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

_ensure_project_root()

# Try to import database module
_db_error = None
try:
    from our_solution.backend.app import database
except Exception as e:
    _db_error = str(e)
    print(f"ERROR during import: {e}")
    traceback.print_exc()


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests - list tickets or get single ticket"""
        if _db_error:
            self._send_json(500, {"error": "Database module failed to load", "details": _db_error})
            return
        
        try:
            # Parse path
            # /api/tickets -> list all
            # /api/tickets?status=active -> list active
            # /api/tickets/123 -> get ticket 123
            
            path_parts = self.path.split('?')
            path = path_parts[0]
            query_string = path_parts[1] if len(path_parts) > 1 else ''
            
            # Extract ticket ID if present
            match = re.match(r'/api/tickets/(\d+)', path)
            
            if match:
                # Get single ticket
                ticket_id = int(match.group(1))
                ticket = database.get_ticket(ticket_id)
                if ticket is None:
                    self._send_json(404, {"error": "Ticket not found"})
                else:
                    self._send_json(200, ticket)
            else:
                # List tickets
                params = self._parse_query_string(query_string)
                status = params.get('status')
                limit = int(params.get('limit', 50))
                offset = int(params.get('offset', 0))
                
                tickets = database.list_tickets(status=status, limit=limit, offset=offset)
                self._send_json(200, tickets)
        
        except Exception as exc:
            print(f"ERROR in do_GET: {exc}")
            traceback.print_exc()
            self._send_json(500, {"error": str(exc)})
    
    def do_POST(self):
        """Handle POST requests - create ticket or close ticket"""
        if _db_error:
            self._send_json(500, {"error": "Database module failed to load", "details": _db_error})
            return
        
        try:
            # Check if this is a close request
            if '/close' in self.path:
                # /api/tickets/123/close
                match = re.match(r'/api/tickets/(\d+)/close', self.path)
                if match:
                    ticket_id = int(match.group(1))
                    ticket = database.close_ticket(ticket_id)
                    if ticket is None:
                        self._send_json(404, {"error": "Ticket not found"})
                    else:
                        self._send_json(200, ticket)
                else:
                    self._send_json(400, {"error": "Invalid close request"})
                return
            
            # Create new ticket
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b'{}'
            
            try:
                data = json.loads(body)
            except Exception as e:
                self._send_json(400, {"error": f"Invalid JSON: {str(e)}"})
                return
            
            alert_text = data.get("alertText", "").strip()
            diagnosis_data = data.get("diagnosis")
            
            if not alert_text or not diagnosis_data:
                self._send_json(400, {"error": "alertText and diagnosis are required"})
                return
            
            ticket = database.create_ticket(alert_text, diagnosis_data)
            self._send_json(201, ticket)
        
        except Exception as exc:
            print(f"ERROR in do_POST: {exc}")
            traceback.print_exc()
            self._send_json(500, {"error": str(exc)})
    
    def do_PUT(self):
        """Handle PUT requests - update ticket"""
        if _db_error:
            self._send_json(500, {"error": "Database module failed to load", "details": _db_error})
            return
        
        try:
            # /api/tickets/123
            match = re.match(r'/api/tickets/(\d+)', self.path)
            if not match:
                self._send_json(400, {"error": "Invalid update request"})
                return
            
            ticket_id = int(match.group(1))
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b'{}'
            
            try:
                updates = json.loads(body)
            except Exception as e:
                self._send_json(400, {"error": f"Invalid JSON: {str(e)}"})
                return
            
            ticket = database.update_ticket(ticket_id, updates)
            if ticket is None:
                self._send_json(404, {"error": "Ticket not found"})
            else:
                self._send_json(200, ticket)
        
        except Exception as exc:
            print(f"ERROR in do_PUT: {exc}")
            traceback.print_exc()
            self._send_json(500, {"error": str(exc)})
    
    def do_DELETE(self):
        """Handle DELETE requests - delete ticket"""
        if _db_error:
            self._send_json(500, {"error": "Database module failed to load", "details": _db_error})
            return
        
        try:
            # /api/tickets/123
            match = re.match(r'/api/tickets/(\d+)', self.path)
            if not match:
                self._send_json(400, {"error": "Invalid delete request"})
                return
            
            ticket_id = int(match.group(1))
            success = database.delete_ticket(ticket_id)
            
            if not success:
                self._send_json(404, {"error": "Ticket not found"})
            else:
                self._send_json(200, {"message": "Ticket deleted"})
        
        except Exception as exc:
            print(f"ERROR in do_DELETE: {exc}")
            traceback.print_exc()
            self._send_json(500, {"error": str(exc)})
    
    def _send_json(self, status_code: int, data: dict):
        """Helper to send JSON responses"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def _parse_query_string(self, query_string: str) -> dict:
        """Parse query string into dictionary"""
        if not query_string:
            return {}
        
        params = {}
        for part in query_string.split('&'):
            if '=' in part:
                key, value = part.split('=', 1)
                params[key] = value
        return params

