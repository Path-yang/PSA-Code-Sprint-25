"""
Flask API for the L2 diagnostic system.

Exposes `/api/diagnose` for POST requests with JSON payload:
    { "alertText": "<raw alert text>" }

Returns structured diagnostic data ready for the React front end.
"""

from __future__ import annotations

import argparse
import os
from typing import Optional

from flask import Flask, jsonify, request
from flask_cors import CORS

from app.config import AZURE_OPENAI_API_KEY
from app.diagnostic_system_optimized import L2DiagnosticSystemOptimized
from app import database

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

_system: Optional[L2DiagnosticSystemOptimized] = None


def get_system() -> L2DiagnosticSystemOptimized:
    """Lazily instantiate the optimized diagnostic system."""
    global _system
    if AZURE_OPENAI_API_KEY is None:
        raise RuntimeError(
            "Azure OpenAI API key is missing. "
            "Set AZURE_OPENAI_API_KEY in your environment or .env file."
        )

    if _system is None:
        _system = L2DiagnosticSystemOptimized()
    return _system


@app.get("/health")
def healthcheck():
    """Simple health endpoint."""
    return jsonify({"status": "ok"})


@app.post("/api/diagnose")
def diagnose():
    """Run diagnostics for the supplied alert text."""
    payload = request.get_json(silent=True) or {}
    alert_text = (payload.get("alertText") or "").strip()

    if not alert_text:
        return jsonify({"error": "alertText is required"}), 400

    try:
        diagnostic = get_system().diagnose(alert_text, verbose=False)
        return jsonify(
            {
                "parsed": diagnostic["parsed"],
                "rootCause": diagnostic["root_cause"],
                "resolution": diagnostic["resolution"],
                "report": diagnostic["report"],
                "logEvidence": diagnostic["log_evidence"],
                "knowledgeBase": diagnostic["kb_articles"],
                "similarCases": diagnostic["similar_cases"],
            }
        )
    except Exception as exc:  # pragma: no cover - top-level safety
        return jsonify({"error": str(exc)}), 500


# ============================================================================
# Ticket Management Endpoints
# ============================================================================

@app.post("/api/tickets")
def create_ticket():
    """Create a new ticket from diagnostic data."""
    payload = request.get_json(silent=True) or {}
    alert_text = payload.get("alertText", "").strip()
    diagnosis_data = payload.get("diagnosis")
    
    if not alert_text or not diagnosis_data:
        return jsonify({"error": "alertText and diagnosis are required"}), 400
    
    try:
        ticket = database.create_ticket(alert_text, diagnosis_data)
        return jsonify(ticket), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/api/tickets")
def list_tickets():
    """List tickets with optional filtering."""
    status = request.args.get("status")  # 'active', 'closed', or None for all
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    
    try:
        tickets = database.list_tickets(status=status, limit=limit, offset=offset)
        return jsonify(tickets)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/api/tickets/<int:ticket_id>")
def get_ticket(ticket_id):
    """Get a specific ticket by ID."""
    try:
        ticket = database.get_ticket(ticket_id)
        if ticket is None:
            return jsonify({"error": "Ticket not found"}), 404
        return jsonify(ticket)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.put("/api/tickets/<int:ticket_id>")
def update_ticket(ticket_id):
    """Update ticket fields."""
    payload = request.get_json(silent=True) or {}
    
    try:
        ticket = database.update_ticket(ticket_id, payload)
        if ticket is None:
            return jsonify({"error": "Ticket not found"}), 404
        return jsonify(ticket)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.post("/api/tickets/<int:ticket_id>/close")
def close_ticket(ticket_id):
    """Close a ticket."""
    try:
        ticket = database.close_ticket(ticket_id)
        if ticket is None:
            return jsonify({"error": "Ticket not found"}), 404
        return jsonify(ticket)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.delete("/api/tickets/<int:ticket_id>")
def delete_ticket(ticket_id):
    """Delete a ticket (for testing/cleanup)."""
    try:
        success = database.delete_ticket(ticket_id)
        if not success:
            return jsonify({"error": "Ticket not found"}), 404
        return jsonify({"message": "Ticket deleted"}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


def main() -> None:
    """Run the Flask development server."""
    parser = argparse.ArgumentParser(description="Run the L2 Diagnostic API server.")
    parser.add_argument(
        "--host",
        default=os.environ.get("FLASK_RUN_HOST", "127.0.0.1"),
        help="Host/IP to bind (default: 127.0.0.1)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("FLASK_RUN_PORT", 5000)),
        help="Port to listen on (default: 5000)",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable Flask debug mode",
    )
    parser.add_argument(
        "--threaded",
        action="store_true",
        default=True,
        help="Enable threaded mode for concurrent requests (default: True)",
    )
    args = parser.parse_args()

    print(f"🚀 Starting Flask server on {args.host}:{args.port}")
    print(f"   Threading: {'Enabled' if args.threaded else 'Disabled'} (supports concurrent requests)")
    
    app.run(host=args.host, port=args.port, debug=args.debug, threaded=args.threaded)


if __name__ == "__main__":  # pragma: no cover
    main()
