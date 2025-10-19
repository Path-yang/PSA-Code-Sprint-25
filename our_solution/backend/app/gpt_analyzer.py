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

    def _calculate_confidence_score(
        self,
        log_evidence: str,
        case_context: str,
        kb_context: str,
        parsed: Dict,
        evidence_summary: List[str]
    ) -> int:
        """
        Calculate algorithmic confidence score based on evidence quality.
        
        Scoring factors:
        - Log evidence: 0-30 points
        - Similar cases: 0-25 points
        - Knowledge base: 0-20 points
        - Specific identifiers: 0-15 points
        - Evidence count: 0-10 points
        
        Returns: Confidence score between 0-100
        """
        confidence = 0
        
        # Factor 1: Log Evidence Quality (0-30 points)
        if log_evidence and "No relevant logs found" not in log_evidence:
            log_lines = log_evidence.count('\n')
            if log_lines >= 5:
                confidence += 30  # Strong log evidence
            elif log_lines >= 2:
                confidence += 20  # Moderate log evidence
            else:
                confidence += 10  # Weak log evidence
        
        # Factor 2: Similar Past Cases (0-25 points)
        if case_context and "No similar past cases found" not in case_context:
            if "Relevance: 100%" in case_context or "Relevance: 9" in case_context:
                confidence += 25  # Exact match to past case
            elif "Relevance: 8" in case_context or "Relevance: 7" in case_context:
                confidence += 20  # Strong similarity
            elif "Relevance: 6" in case_context or "Relevance: 5" in case_context:
                confidence += 15  # Moderate similarity
            else:
                confidence += 10  # Weak similarity
        
        # Factor 3: Knowledge Base Coverage (0-20 points)
        if kb_context and "No relevant knowledge base articles found" not in kb_context:
            if "Resolution" in kb_context or "Verification" in kb_context:
                confidence += 20  # Has documented resolution procedure
            else:
                confidence += 10  # Has related KB articles
        
        # Factor 4: Specific Identifiers (0-15 points)
        identifiers_found = 0
        if parsed.get("entity_id"):
            identifiers_found += 1
        if parsed.get("error_code"):
            identifiers_found += 1
        if parsed.get("module") and parsed.get("module") != "Unknown":
            identifiers_found += 1
        
        confidence += min(15, identifiers_found * 5)
        
        # Factor 5: Evidence Summary Quality (0-10 points)
        if evidence_summary and len(evidence_summary) > 0:
            evidence_count = len(evidence_summary)
            if evidence_count >= 4:
                confidence += 10  # Strong evidence base
            elif evidence_count >= 2:
                confidence += 7   # Moderate evidence base
            else:
                confidence += 4   # Minimal evidence base
        
        # Ensure confidence is within 0-100 range
        return min(100, max(0, confidence))

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
            result = json.loads(response)
            # Replace GPT's subjective confidence with algorithmic calculation
            algorithmic_confidence = self._calculate_confidence_score(
                log_evidence=log_evidence,
                case_context=case_context,
                kb_context=kb_context,
                parsed=parsed,
                evidence_summary=result.get("evidence_summary", [])
            )
            result["confidence"] = algorithmic_confidence
            return result
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

Provide detailed resolution steps:

Return JSON:
{{
    "resolution_steps": [
        "Specific action with commands/SQL if applicable",
        "Next action...",
        "Continue..."
    ],
    "verification_steps": [
        "How to verify the fix worked"
    ],
    "sql_queries": [
        "Any SQL queries needed (if applicable)"
    ],
    "estimated_time": "estimated time to resolve (e.g., '15 minutes')",
    "escalate": true/false,
    "escalate_to": "Module owner (Container/Vessel/EDI-API) or null",
    "escalate_reason": "why escalation is or isn't needed"
}}

NOTE: Write each resolution step as a direct action statement without "Step 1:", "Step 2:" prefixes or special characters like ")".

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

Use clear formatting with headers, bullet points, and code blocks where appropriate.
Make it professional and ready to present to stakeholders."""

        return self._call_gpt(system_prompt, user_prompt, temperature=0.4)
