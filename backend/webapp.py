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
from app.diagnostic_system import L2DiagnosticSystem

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

_system: Optional[L2DiagnosticSystem] = None


def get_system() -> L2DiagnosticSystem:
    """Lazily instantiate the diagnostic system."""
    global _system
    if AZURE_OPENAI_API_KEY is None:
        raise RuntimeError(
            "Azure OpenAI API key is missing. "
            "Set AZURE_OPENAI_API_KEY in your environment or .env file."
        )

    if _system is None:
        _system = L2DiagnosticSystem()
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
    args = parser.parse_args()

    app.run(host=args.host, port=args.port, debug=args.debug)


if __name__ == "__main__":  # pragma: no cover
    main()
