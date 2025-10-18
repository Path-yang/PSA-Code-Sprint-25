"""
Vercel serverless function that exposes the L2 diagnostic system.
"""

import json
from typing import Any, Dict

from my_solution.backend.app.diagnostic_system import L2DiagnosticSystem

_system: L2DiagnosticSystem | None = None


def _json_response(status: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload),
    }


def handler(request: Any) -> Dict[str, Any]:
    """Entry point for the Vercel Python runtime."""
    global _system

    if _system is None:
        _system = L2DiagnosticSystem()

    if request.method != "POST":
        return _json_response(405, {"error": "Method Not Allowed"})

    try:
        data = request.json()
    except Exception:
        try:
            data = json.loads(request.body or "{}")
        except Exception:
            data = {}

    alert_text = (data.get("alertText") or "").strip()
    if not alert_text:
        return _json_response(400, {"error": "alertText is required"})

    try:
        result = _system.diagnose(alert_text, verbose=False)
        return _json_response(
            200,
            {
                "parsed": result["parsed"],
                "rootCause": result["root_cause"],
                "resolution": result["resolution"],
                "report": result["report"],
                "logEvidence": result["log_evidence"],
                "knowledgeBase": result["kb_articles"],
                "similarCases": result["similar_cases"],
            },
        )
    except Exception as exc:
        return _json_response(500, {"error": str(exc)})
