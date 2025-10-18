"""Vercel serverless function exposing the L2 diagnostic system."""

from http.server import BaseHTTPRequestHandler
import json
import os
import sys

# Ensure project root is on sys.path for module imports
def _ensure_project_root():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
    if project_root not in sys.path:
        sys.path.append(project_root)

_ensure_project_root()

from my_solution.backend.app.diagnostic_system import L2DiagnosticSystem

_system: L2DiagnosticSystem | None = None


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """Handle POST requests for diagnostic analysis"""
        global _system
        
        try:
            # Initialize system if needed
            if _system is None:
                _system = L2DiagnosticSystem()
            
            # Read and parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b'{}'
            
            try:
                data = json.loads(body)
            except:
                data = {}
            
            alert_text = (data.get("alertText") or "").strip()
            if not alert_text:
                self._send_json(400, {"error": "alertText is required"})
                return
            
            # Run diagnostics
            result = _system.diagnose(alert_text, verbose=False)
            
            # Send success response
            self._send_json(200, {
                "parsed": result["parsed"],
                "rootCause": result["root_cause"],
                "resolution": result["resolution"],
                "report": result["report"],
                "logEvidence": result["log_evidence"],
                "knowledgeBase": result["kb_articles"],
                "similarCases": result["similar_cases"],
            })
            
        except Exception as exc:
            self._send_json(500, {"error": str(exc)})
    
    def _send_json(self, status_code: int, data: dict):
        """Helper to send JSON responses"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
