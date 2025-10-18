"""
GPT-powered analysis using Azure OpenAI.
"""

import json
from typing import Dict, List

from openai import AzureOpenAI


class GPTAnalyzer:
    """Use Azure OpenAI for intelligent analysis."""

    def __init__(self, api_key: str, endpoint: str, api_version: str, deployment: str):
        self.client = AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint,
        )
        self.deployment = deployment

    def _call_gpt(self, system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:
        """Call Azure OpenAI."""
        try:
            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
            )
            return response.choices[0].message.content
        except Exception as exc:
            print(f"Error calling Azure OpenAI: {exc}")
            return "{}"

    def parse_alert(self, alert_text: str) -> Dict:
        """Parse alert and extract key information."""
        system_prompt = """You are a L2 support ticket parser for a port terminal operations system.
Extract key information from support alerts and return structured JSON."""

        user_prompt = f"""Parse this support alert and extract key information:

ALERT:
{alert_text}

Return JSON with this exact structure:
{{
    "ticket_id": "ticket ID from alert (e.g., ALR-861600, INC-154599, TCK-742311)",
    "channel": "Email/SMS/Call",
    "module": "Container/Vessel/EDI-API",
    "priority": "Low/Medium/High/Critical",
    "entity_type": "container/vessel/message/other",
    "entity_id": "the specific container number, vessel name, or message reference",
    "symptoms": ["list of symptoms as brief keywords"],
    "error_code": "error code if mentioned, otherwise null",
    "reporter": "who reported this"
}}

Return ONLY valid JSON, no additional text."""

        response = self._call_gpt(system_prompt, user_prompt, temperature=0)
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "ticket_id": "UNKNOWN",
                "channel": "Email",
                "module": "Unknown",
                "priority": "Medium",
                "entity_type": "unknown",
                "entity_id": "",
                "symptoms": [],
                "error_code": None,
                "reporter": "Unknown",
            }

    def analyze_root_cause(
        self,
        alert: str,
        parsed: Dict,
        log_evidence: str,
        case_context: str,
        kb_context: str,
    ) -> Dict:
        """Analyze root cause from evidence."""
        system_prompt = """You are an expert L2 Product Operations engineer.
Analyze evidence and determine the root cause of issues in a port terminal system."""

        user_prompt = f"""Analyze this support ticket and determine the root cause.

ORIGINAL ALERT:
{alert}

PARSED INFO:
{json.dumps(parsed, indent=2)}

LOG EVIDENCE:
{log_evidence if log_evidence else "No relevant logs found"}

SIMILAR PAST CASES:
{case_context if case_context else "No similar cases found"}

KNOWLEDGE BASE CONTEXT:
{kb_context[:2000] if kb_context else "No KB context"}

Based on the evidence, provide analysis:

Return JSON:
{{
    "root_cause": "2-3 sentence explanation of what went wrong",
    "technical_details": "technical explanation of why this happened",
    "confidence": 0-100,
    "evidence_summary": ["key pieces of evidence supporting this diagnosis"],
    "affected_systems": ["which systems/services are impacted"]
}}

Return ONLY valid JSON."""

        response = self._call_gpt(system_prompt, user_prompt, temperature=0.3)
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "root_cause": "Unable to determine",
                "technical_details": "Analysis failed",
                "confidence": 0,
                "evidence_summary": [],
                "affected_systems": [],
            }

    def get_resolution_steps(
        self,
        parsed: Dict,
        root_cause: Dict,
        kb_context: str,
        case_solutions: str,
    ) -> Dict:
        """Get resolution steps based on analysis."""
        system_prompt = """You are an L2 support engineer providing actionable resolution steps.
Use the knowledge base and past case solutions to provide specific, proven solutions."""

        user_prompt = f"""Based on this diagnosis, provide resolution steps.

PROBLEM:
{json.dumps(parsed, indent=2)}

ROOT CAUSE:
{json.dumps(root_cause, indent=2)}

KNOWLEDGE BASE (relevant articles):
{kb_context[:2000] if kb_context else "No KB context"}

PAST CASE SOLUTIONS:
{case_solutions if case_solutions else "No past solutions found"}

Provide detailed resolution steps. Each step should be a clear action statement WITHOUT numbering prefixes like "Step 1:", "Step 2:", etc. (numbers will be added automatically in the UI).

Return JSON:
{{
    "resolution_steps": [
        "First action to take with specific details",
        "Second action with commands/SQL if applicable",
        "Third action...",
        "Continue with as many steps as needed for complete resolution"
    ],
    "verification_steps": [
        "How to verify the fix worked",
        "Additional verification checks"
    ],
    "sql_queries": [
        "Any SQL queries needed (if applicable)"
    ],
    "estimated_time": "estimated time to resolve (e.g., '15 minutes')",
    "escalate": true/false,
    "escalate_to": "Module owner (Container/Vessel/EDI-API) or null",
    "escalate_reason": "why escalation is or isn't needed"
}}

IMPORTANT: Write clear action statements WITHOUT "Step N:" prefixes or special characters like ")". Be thorough and include ALL necessary steps.

Return ONLY valid JSON."""

        response = self._call_gpt(system_prompt, user_prompt, temperature=0.2)
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "resolution_steps": ["Manual investigation required"],
                "verification_steps": [],
                "sql_queries": [],
                "estimated_time": "Unknown",
                "escalate": True,
                "escalate_to": "Product Team",
                "escalate_reason": "Unable to determine resolution automatically",
            }

    def generate_report(
        self,
        alert: str,
        parsed: Dict,
        log_evidence: str,
        similar_cases: str,
        root_cause: Dict,
        resolution: Dict,
    ) -> str:
        """Generate polished diagnostic report."""
        system_prompt = """You are generating professional L2 diagnostic reports for port terminal operations.
Create clear, actionable reports that L2 engineers can use immediately."""

        user_prompt = f"""Generate a complete diagnostic report for this ticket.

ORIGINAL ALERT:
{alert}

PARSED DATA:
{json.dumps(parsed, indent=2)}

LOG EVIDENCE:
{log_evidence if log_evidence else "No logs found"}

SIMILAR PAST CASES:
{similar_cases if similar_cases else "No similar cases"}

ROOT CAUSE ANALYSIS:
{json.dumps(root_cause, indent=2)}

RESOLUTION:
{json.dumps(resolution, indent=2)}

Create a well-formatted markdown report with:
1. Executive Summary (2-3 sentences)
2. Ticket Information (ID, channel, priority, module)
3. Root Cause Analysis (with evidence)
4. Resolution Steps (numbered and actionable)
5. Verification Checklist
6. Escalation Guidance (if needed)

IMPORTANT FORMATTING RULES:
- When listing numbered steps, do NOT add extra numbering or prefixes before items
- Each step should be a clear, direct action statement
- Do NOT include "Step 1:", "Step 2:", etc. prefixes (markdown numbering handles this)
- Do NOT add special characters like ")" or extra symbols
- Keep SQL queries and commands in separate code blocks

Use clear formatting with headers, bullet points, and code blocks where appropriate.
Make it professional and ready to present to stakeholders."""

        return self._call_gpt(system_prompt, user_prompt, temperature=0.4)
