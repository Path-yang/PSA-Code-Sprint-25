"""
Optimized GPT Analyzer - Combines multiple GPT calls into fewer calls
Reduces from 5-7 GPT calls to just 2 GPT calls per diagnosis
"""

import json
from typing import Dict, List

from openai import AzureOpenAI


class GPTAnalyzerOptimized:
    """Optimized GPT Analyzer with combined calls for faster performance."""

    def __init__(self, api_key: str, endpoint: str, api_version: str, deployment: str):
        self.client = AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint,
            timeout=30.0,  # Add timeout to prevent hanging
        )
        self.deployment = deployment

    def _call_gpt(self, system_prompt: str, user_prompt: str, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        """Call Azure OpenAI with timeout protection."""
        try:
            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content
        except Exception as exc:
            print(f"⚠️  GPT API Error: {exc}")
            return "{}"

    def analyze_alert_and_root_cause(
        self,
        alert_text: str,
        log_evidence: str,
        case_context: str,
        kb_context: str,
    ) -> Dict:
        """
        COMBINED CALL #1: Parse alert AND analyze root cause in one GPT call.
        This replaces 2 separate calls (parse_alert + analyze_root_cause).
        """
        system_prompt = """You are an L2 support engineer analyzing technical alerts.
Parse the alert AND identify the root cause in one analysis."""

        # Limit context to prevent slow responses
        log_context = log_evidence[:1500] if log_evidence else "No logs found"
        case_ctx = case_context[:1500] if case_context else "No similar cases"
        kb_ctx = kb_context[:1500] if kb_context else "No KB articles"

        user_prompt = f"""Analyze this alert in ONE response:

ALERT:
{alert_text[:1000]}

LOG EVIDENCE:
{log_context}

PAST CASES:
{case_ctx}

KNOWLEDGE BASE:
{kb_ctx}

Provide BOTH parsing AND root cause analysis in ONE JSON response:

{{
    "parsed": {{
        "ticket_id": "Extract from alert (e.g., ALR-123, INC-456)",
        "module": "MUST be one of: Container, Vessel, EDI/API (EDI issues must always be EDI/API, never just EDI)",
        "entity_id": "Container/Vessel ID or IFT number",
        "channel": "Email/SMS/Call",
        "priority": "High/Medium/Low",
        "symptoms": ["brief", "keywords"],
        "error_code": "if any"
    }},
    "root_cause": {{
        "root_cause": "Brief root cause (one sentence)",
        "technical_details": "Technical explanation",
        "confidence": 50-100,
        "evidence_summary": ["Key evidence point 1", "Key evidence point 2"]
    }}
}}

Return ONLY valid JSON. Be concise."""

        response = self._call_gpt(system_prompt, user_prompt, temperature=0.2, max_tokens=1500)
        try:
            result = json.loads(response)
            
            # FORCE EDI to be EDI/API - hard override
            parsed_data = result.get("parsed", {})
            if parsed_data.get("module") == "EDI":
                parsed_data["module"] = "EDI/API"
            
            return {
                "parsed": parsed_data,
                "root_cause": result.get("root_cause", {})
            }
        except json.JSONDecodeError:
            # Fallback
            return {
                "parsed": {
                    "ticket_id": "UNKNOWN",
                    "module": "Unknown",
                    "entity_id": "",
                    "channel": "Email",
                    "priority": "Medium",
                    "symptoms": ["analysis", "needed"],
                },
                "root_cause": {
                    "root_cause": "Unable to determine",
                    "technical_details": "Analysis failed",
                    "confidence": 30,
                    "evidence_summary": []
                }
            }

    def generate_resolution_and_decision(
        self,
        parsed: Dict,
        root_cause: Dict,
        confidence_score: int,
        kb_context: str,
        case_solutions: str,
        alert_text: str,
        log_evidence: str,
    ) -> Dict:
        """
        COMBINED CALL #2: Generate resolution, escalation decision, AND report in one GPT call.
        This replaces 3+ separate calls (resolution, escalation, report).
        """
        system_prompt = """You are an L2 support engineer providing complete resolution guidance.
Provide resolution steps, escalation decision, AND a diagnostic report in ONE response."""

        # Limit context
        kb_ctx = kb_context[:2000] if kb_context else "No KB guidance"
        case_sol = case_solutions[:1000] if case_solutions else "No past solutions"

        priority = parsed.get("priority", "Medium")
        module = parsed.get("module", "Unknown")
        
        # Escalation logic hints
        should_escalate_hint = ""
        if priority == "High" or confidence_score < 40:
            should_escalate_hint = "ESCALATION RECOMMENDED due to high priority or low confidence."
        elif confidence_score < 60:
            should_escalate_hint = "Consider escalation if issue persists."
        
        user_prompt = f"""Provide COMPLETE resolution guidance for this issue:

PROBLEM:
Ticket: {parsed.get('ticket_id', 'Unknown')}
Module: {module}
Priority: {priority}
Root Cause: {root_cause.get('root_cause', 'Unknown')}
Confidence: {confidence_score}%

{should_escalate_hint}

KNOWLEDGE BASE:
{kb_ctx}

PAST SOLUTIONS:
{case_sol}

Provide ONE JSON with resolution, escalation, AND markdown report:

{{
    "resolution": {{
        "resolution_steps": [
            "Step 1: Specific action",
            "Step 2: Next action",
            "Step 3: Continue..."
        ],
        "verification_steps": ["How to verify"],
        "sql_queries": ["SQL if needed"],
        "estimated_time": "15 minutes",
        "time_breakdown": {{
            "resolution_steps_time": "10 minutes",
            "verification_steps_time": "3 minutes",
            "sql_commands_time": "2 minutes"
        }},
        "escalate": true/false,
        "escalate_to": "Vessel Management Team / Container Team / EDI/API Team / Product Team",
        "escalate_reason": "Reason for escalation decision"
    }},
    "report": "# Diagnostic Report\\n\\n## Issue\\n[Summary]\\n\\n## Root Cause\\n[Analysis]\\n\\n## Resolution\\n[Steps]"
}}

ESCALATION RULES:
- High priority + confidence < 50% → escalate
- Medium priority + confidence < 40% → escalate  
- Low confidence (<40%) → escalate
- High confidence (>70%) + clear KB solution → do NOT escalate

Module escalation targets:
- Container → Container Team
- Vessel → Vessel Management Team
- EDI/API → EDI/API Team
- Unknown/Other → Product Team

Return ONLY valid JSON. Keep report concise (max 500 words)."""

        response = self._call_gpt(system_prompt, user_prompt, temperature=0.2, max_tokens=2500)
        try:
            result = json.loads(response)
            
            # FORCE EDI to be EDI/API in escalation target - hard override
            resolution = result.get("resolution", self._get_fallback_resolution(parsed))
            if resolution.get("escalate_to"):
                resolution["escalate_to"] = resolution["escalate_to"].replace("EDI Team", "EDI/API Team").replace(" EDI ", " EDI/API ")
            
            return {
                "resolution": resolution,
                "report": result.get("report", "# Diagnostic Report\n\nAnalysis in progress...")
            }
        except json.JSONDecodeError:
            return {
                "resolution": self._get_fallback_resolution(parsed),
                "report": "# Diagnostic Report\n\n## Issue\nAnalysis completed with limited information.\n\n## Recommendation\nManual investigation required."
            }

    def _get_fallback_resolution(self, parsed: Dict) -> Dict:
        """Fallback resolution when GPT fails."""
        return {
            "resolution_steps": [
                "Review alert details and gather more information",
                "Check system logs for additional context",
                "Consult with team lead for guidance"
            ],
            "verification_steps": ["Verify issue status"],
            "sql_queries": [],
            "estimated_time": "30 minutes",
            "time_breakdown": {
                "resolution_steps_time": "20 minutes",
                "verification_steps_time": "10 minutes",
                "sql_commands_time": "0 minutes"
            },
            "escalate": True,
            "escalate_to": f"{parsed.get('module', 'Product')} Team",
            "escalate_reason": "Insufficient information for confident resolution"
        }

    def calculate_confidence_fast(
        self,
        log_evidence: List,
        similar_cases: List,
        kb_articles: List,
        parsed: Dict,
        root_cause_confidence: int
    ) -> Dict:
        """
        Fast confidence calculation without GPT call.
        Uses heuristics based on evidence quality.
        """
        # Factor 1: Log Evidence (0-100%)
        log_percentage = min(100, len(log_evidence) * 20) if log_evidence else 0
        
        # Factor 2: Similar Cases (0-100%)
        if similar_cases and len(similar_cases) > 0:
            best_relevance = similar_cases[0].get("relevance_score", 0)
            if best_relevance > 0.7:
                case_percentage = 90
            elif best_relevance > 0.5:
                case_percentage = 70
            else:
                case_percentage = 40
        else:
            case_percentage = 0
        
        # Factor 3: KB Articles (0-100%)
        if kb_articles and len(kb_articles) > 0:
            kb_percentage = 75  # KB exists for module
        else:
            kb_percentage = 0
        
        # Factor 4: Identifiers (0-100%)
        identifiers = 0
        if parsed.get("entity_id"):
            identifiers += 1
        if parsed.get("error_code"):
            identifiers += 1
        if parsed.get("module") and parsed.get("module") != "Unknown":
            identifiers += 1
        identifier_percentage = int((identifiers / 3) * 100)
        
        # Weighted calculation
        overall_score = int(
            (log_percentage * 0.15) +
            (case_percentage * 0.25) +
            (kb_percentage * 0.30) +
            (identifier_percentage * 0.15) +
            (root_cause_confidence * 0.15)
        )
        
        # Determine recommendation
        if overall_score >= 70:
            recommendation = "PROCEED"
        elif overall_score >= 50:
            recommendation = "PROCEED WITH CAUTION"
        elif overall_score >= 30:
            recommendation = "INVESTIGATE FURTHER"
        else:
            recommendation = "ESCALATE"
        
        return {
            "overall_score": overall_score,
            "breakdown": {
                "log_evidence": {"percentage": log_percentage, "status": "good" if log_percentage >= 50 else "limited" if log_percentage > 0 else "none"},
                "past_cases": {"percentage": case_percentage, "status": "good" if case_percentage >= 50 else "limited" if case_percentage > 0 else "none"},
                "knowledge_base": {"percentage": kb_percentage, "status": "good" if kb_percentage >= 50 else "limited" if kb_percentage > 0 else "none"},
                "identifiers": {"percentage": identifier_percentage, "status": "good" if identifier_percentage >= 50 else "limited" if identifier_percentage > 0 else "none"},
            },
            "interpretation": {
                "diagnosis_confidence": "HIGH" if overall_score >= 70 else "MODERATE" if overall_score >= 50 else "LOW",
                "solution_confidence": "HIGH" if kb_percentage >= 70 else "MODERATE" if kb_percentage >= 50 else "LOW",
                "recommendation": recommendation,
                "recommendation_detail": f"{recommendation}: {overall_score}% confidence"
            }
        }

