"""
Simple Flask web application to run the L2 diagnostic system from a browser.

Usage:
    export AZURE_OPENAI_API_KEY=...
    export AZURE_OPENAI_ENDPOINT=...
    export AZURE_OPENAI_API_VERSION=...
    export AZURE_OPENAI_DEPLOYMENT=...
    cd my_solution
    source venv/bin/activate
    pip install -r requirements.txt   # once
    python webapp.py
"""

from __future__ import annotations

import argparse
import os
from typing import Optional

from flask import Flask, render_template_string, request

from diagnostic_system import L2DiagnosticSystem
from config import AZURE_OPENAI_API_KEY


APP_TITLE = "L2 Diagnostic Web Console"

app = Flask(__name__)

_system: Optional[L2DiagnosticSystem] = None


def get_system() -> L2DiagnosticSystem:
    """
    Lazily instantiate the diagnostic system once per process.
    Raises a helpful error if the API key is missing.
    """
    global _system
    if AZURE_OPENAI_API_KEY is None:
        raise RuntimeError(
            "Azure OpenAI API key is missing. "
            "Set AZURE_OPENAI_API_KEY in your environment before starting the app."
        )

    if _system is None:
        _system = L2DiagnosticSystem()
    return _system


TEMPLATE = """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ title }}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; background: #f5f6fa; }
      header { background: #002b55; color: #fff; padding: 1.5rem 2rem; }
      main { padding: 2rem; max-width: 960px; margin: 0 auto; }
      textarea { width: 100%; min-height: 220px; padding: 1rem; font-family: monospace; font-size: 0.95rem; }
      button { background: #005fa3; color: #fff; border: none; padding: 0.8rem 1.4rem; font-size: 1rem; cursor: pointer; border-radius: 4px; }
      button:hover { background: #024b7f; }
      .card { background: #fff; border-radius: 8px; padding: 1.5rem; margin-top: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      .error { color: #c00; margin-top: 1rem; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
      .section-title { font-size: 1.15rem; margin-bottom: 0.5rem; color: #00396b; }
      ul { padding-left: 1.2rem; }
      pre { white-space: pre-wrap; background: #0b1120; color: #d1d5db; padding: 1.25rem; border-radius: 6px; overflow-x: auto; }
      footer { text-align: center; font-size: 0.85rem; color: #444; margin: 2rem 0 1rem; }
      @media (max-width: 720px) {
        .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>{{ title }}</h1>
      <p>Paste an alert (email, SMS, or call transcript) and generate an incident report.</p>
    </header>
    <main>
      <form method="post">
        <label for="alert_text"><strong>Alert text</strong></label>
        <textarea id="alert_text" name="alert_text" placeholder="Paste test case or real alert here...">{{ alert_text }}</textarea>
        <div style="margin-top: 1rem;">
          <button type="submit">Run diagnostics</button>
        </div>
      </form>

      {% if error %}
        <div class="card error">
          <strong>Error:</strong> {{ error }}
        </div>
      {% endif %}

      {% if result %}
        <div class="card">
          <h2 class="section-title">Parsed ticket</h2>
          <div class="grid">
            <div>
              <p><strong>Ticket ID:</strong> {{ result.parsed.ticket_id }}</p>
              <p><strong>Channel:</strong> {{ result.parsed.channel }}</p>
              <p><strong>Module:</strong> {{ result.parsed.module }}</p>
              <p><strong>Priority:</strong> {{ result.parsed.priority }}</p>
            </div>
            <div>
              <p><strong>Entity:</strong> {{ result.parsed.entity_id or 'N/A' }}</p>
              <p><strong>Error code:</strong> {{ result.parsed.error_code or 'N/A' }}</p>
              <p><strong>Reporter:</strong> {{ result.parsed.reporter or 'Unknown' }}</p>
              <p><strong>Symptoms:</strong> {{ result.parsed.symptoms or [] }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 class="section-title">Root cause</h2>
          <p>{{ result.root.root_cause }}</p>
          <p><em>Technical details:</em> {{ result.root.technical_details }}</p>
          <p><strong>Confidence:</strong> {{ result.root.confidence }}%</p>
          {% if result.root.evidence_summary %}
            <p><strong>Evidence:</strong></p>
            <ul>
              {% for item in result.root.evidence_summary %}
                <li>{{ item }}</li>
              {% endfor %}
            </ul>
          {% endif %}
        </div>

        <div class="card">
          <h2 class="section-title">Resolution plan</h2>
          <p><strong>Estimated time:</strong> {{ result.resolution.estimated_time or 'Unknown' }}</p>
          <p><strong>Escalate:</strong> {{ 'Yes, to ' ~ result.resolution.escalate_to if result.resolution.escalate else 'No' }}</p>
          {% if result.resolution.resolution_steps %}
            <h3>Steps</h3>
            <ol>
            {% for step in result.resolution.resolution_steps %}
              <li>{{ step }}</li>
            {% endfor %}
            </ol>
          {% endif %}
          {% if result.resolution.verification_steps %}
            <h3>Verification</h3>
            <ul>
            {% for step in result.resolution.verification_steps %}
              <li>{{ step }}</li>
            {% endfor %}
            </ul>
          {% endif %}
          {% if result.resolution.sql_queries %}
            <h3>SQL / Commands</h3>
            <pre>{{ result.resolution.sql_queries | join('\\n\\n') }}</pre>
          {% endif %}
        </div>

        <div class="card">
          <h2 class="section-title">Full diagnostic report</h2>
          <pre>{{ result.report }}</pre>
        </div>
      {% endif %}
    </main>
    <footer>
      {{ title }} — paste, diagnose, resolve.
    </footer>
  </body>
</html>
"""


@app.route("/", methods=["GET", "POST"])
def index():
    alert_text = ""
    error = None
    result = None

    if request.method == "POST":
        alert_text = request.form.get("alert_text", "").strip()
        if not alert_text:
            error = "Please paste an alert before running diagnostics."
        else:
            try:
                diagnostic = get_system().diagnose(alert_text, verbose=False)
                result = {
                    "parsed": diagnostic["parsed"],
                    "root": diagnostic["root_cause"],
                    "resolution": diagnostic["resolution"],
                    "report": diagnostic["report"],
                }
            except Exception as exc:
                error = f"Diagnostics failed: {exc}"

    return render_template_string(
        TEMPLATE,
        title=APP_TITLE,
        alert_text=alert_text,
        error=error,
        result=result,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the L2 Diagnostic web console.")
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
