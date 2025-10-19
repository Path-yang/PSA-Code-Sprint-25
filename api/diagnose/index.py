"""Vercel serverless function exposing the L2 diagnostic system."""

from http.server import BaseHTTPRequestHandler
import json
import os
import sys
import traceback

# Ensure project root is on sys.path for module imports
def _ensure_project_root():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Go from api/diagnose/ up to repo root
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

_ensure_project_root()

# Try to import and initialize the system
_system = None
_init_error = None

try:
    from our_solution.backend.app.diagnostic_system import L2DiagnosticSystem
    # Don't initialize yet - do it on first request
except Exception as e:
    _init_error = str(e)
    print(f"ERROR during import: {e}")
    traceback.print_exc()


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests for debugging"""
        self._send_json(200, {
            "message": "Diagnose endpoint is working",
            "method": "GET",
            "import_error": _init_error,
            "system_initialized": _system is not None
        })
    
    def do_POST(self):
        """Handle POST requests for diagnostic analysis"""
        global _system
        
        # Check for import errors first
        if _init_error:
            self._send_json(500, {
                "error": "Failed to import diagnostic system",
                "details": _init_error
            })
            return
        
        try:
            # Initialize system on first request
            if _system is None:
                print("Initializing L2DiagnosticSystem...")
                _system = L2DiagnosticSystem()
                print("L2DiagnosticSystem initialized successfully")
            
            # Read and parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b'{}'
            
            try:
                data = json.loads(body)
            except Exception as e:
                self._send_json(400, {"error": f"Invalid JSON: {str(e)}"})
                return
            
            alert_text = (data.get("alertText") or "").strip()
            if not alert_text:
                self._send_json(400, {"error": "alertText is required"})
                return
            
            print(f"Running diagnostics for alert: {alert_text[:100]}...")
            
            # Run diagnostics
            result = _system.diagnose(alert_text, verbose=False)
            
            print("Diagnostics completed successfully")
            
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
            print(f"ERROR in do_POST: {exc}")
            traceback.print_exc()
            self._send_json(500, {
                "error": str(exc),
                "type": type(exc).__name__,
                "traceback": traceback.format_exc()
            })
    
    def _send_json(self, status_code: int, data: dict):
        """Helper to send JSON responses"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
