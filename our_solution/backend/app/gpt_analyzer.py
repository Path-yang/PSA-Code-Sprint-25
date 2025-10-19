"""
GPT-powered analysis using Azure OpenAI.
Enhanced with structured metadata and improved escalation logic.
"""

import json
from typing import Dict, List

from openai import AzureOpenAI
from .impact_assessor import ImpactAssessor
from .severity_classifier import SeverityClassifier
from .justification_engine import JustificationEngine
from .learning_feedback import LearningFeedback


class GPTAnalyzer:
    """Use Azure OpenAI for intelligent analysis."""

    def __init__(self, api_key: str, endpoint: str, api_version: str, deployment: str):
        self.client = AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint,
        )
        self.deployment = deployment
        
        # Initialize enhanced escalation components
        self.impact_assessor = ImpactAssessor()
        self.severity_classifier = SeverityClassifier()
        self.justification_engine = JustificationEngine()
        self.learning_feedback = LearningFeedback()

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

    def generate_confidence_assessment(
        self,
        log_evidence: List[Dict],
        similar_cases: List[Dict],
        kb_articles: List[Dict],
        parsed: Dict,
        evidence_summary: List[str]
    ) -> Dict:
        """
        Generate comprehensive confidence assessment with breakdown and interpretation.
        
        Uses actual data objects to calculate accurate confidence percentages.
        """
        print(f"DEBUG generate_confidence_assessment called:")
        print(f"  - log_evidence: {len(log_evidence) if log_evidence else 0} items")
        print(f"  - similar_cases: {len(similar_cases) if similar_cases else 0} items")
        print(f"  - kb_articles: {len(kb_articles) if kb_articles else 0} items")
        
        # Calculate individual component percentages
        log_percentage = 0
        case_percentage = 0
        kb_percentage = 0
        identifier_percentage = 0
        evidence_percentage = 0
        
        # Factor 1: Log Evidence (0-100%)
        if log_evidence and len(log_evidence) > 0:
            log_count = len(log_evidence)
            if log_count >= 5:
                log_percentage = 100  # Excellent
            elif log_count >= 3:
                log_percentage = 75   # Good
            elif log_count >= 1:
                log_percentage = 50   # Moderate
            else:
                log_percentage = 25   # Limited
        
        # Factor 2: Similar Past Cases (0-100%)
        if similar_cases and len(similar_cases) > 0:
            # Use the best match's relevance score
            best_relevance = similar_cases[0].get('relevance_score', 0)
            print(f"  DEBUG: best_relevance for cases = {best_relevance}")
            if best_relevance > 0:
                case_percentage = int(best_relevance * 100)  # Convert 0.0-1.0 to 0-100%
                print(f"  DEBUG: case_percentage set to {case_percentage}% (keyword match)")
            else:
                # Fallback case: has cases but no relevance score (module-based search)
                # GPT is still using these, so give moderate confidence
                case_percentage = 40
                print(f"  DEBUG: case_percentage set to 40% (module fallback)")
        
        # Factor 3: Knowledge Base (0-100%)
        if kb_articles and len(kb_articles) > 0:
            # Check if this is a keyword match (has relevance_score) or module fallback (no relevance_score)
            best_kb_relevance = kb_articles[0].get('relevance_score', 0)
            print(f"  DEBUG: best_kb_relevance = {best_kb_relevance}")
            
            # Check if KB has resolution procedures
            has_resolution = any('Resolution' in article.get('content', '') or 'Verification' in article.get('content', '') 
                               for article in kb_articles[:3])
            print(f"  DEBUG: has_resolution = {has_resolution}")
            
            # Check if error code is in KB article title (indicates exact match from error code search)
            error_code_match = False
            if parsed.get("error_code"):
                error_code_match = any(parsed["error_code"] in article.get('title', '') 
                                     for article in kb_articles[:3])
            print(f"  DEBUG: error_code_match = {error_code_match}")
            
            if error_code_match and has_resolution:
                # Perfect match: error code found in KB with resolution procedures
                kb_percentage = 100
                print(f"  DEBUG: kb_percentage set to 100% (error code match with resolution)")
            elif error_code_match:
                # Error code match but no specific resolution
                kb_percentage = 85
                print(f"  DEBUG: kb_percentage set to 85% (error code match)")
            elif best_kb_relevance > 0:
                # Keyword match - use actual relevance score
                kb_percentage = int(best_kb_relevance * 100)
                print(f"  DEBUG: kb_percentage set to {kb_percentage}% (keyword match)")
            elif has_resolution:
                # Module fallback with resolution procedures - still valuable
                kb_percentage = 70
                print(f"  DEBUG: kb_percentage set to 70% (module fallback with resolution)")
            else:
                # Module fallback without specific resolution - lower confidence
                kb_percentage = 40
                print(f"  DEBUG: kb_percentage set to 40% (module fallback without resolution)")
        
        # Factor 4: Specific Identifiers (0-100%)
        identifiers_found = 0
        if parsed.get("entity_id"):
            identifiers_found += 1
        if parsed.get("error_code"):
            identifiers_found += 1
        if parsed.get("module") and parsed.get("module") != "Unknown":
            identifiers_found += 1
        identifier_percentage = int((identifiers_found / 3) * 100) if identifiers_found > 0 else 0
        
        # Factor 5: Evidence Quality (0-100%)
        if evidence_summary and len(evidence_summary) > 0:
            evidence_count = len(evidence_summary)
            if evidence_count >= 4:
                evidence_percentage = 100
            elif evidence_count >= 3:
                evidence_percentage = 75
            elif evidence_count >= 2:
                evidence_percentage = 50
            else:
                evidence_percentage = 25
        
        # Calculate base confidence score (enhanced approach)
        # Original weights optimized for KB-heavy scenarios
        # KB=40% (most important - documented procedures)
        # Identifiers=20% (error codes are critical for diagnosis)
        # Evidence=20% (GPT's analysis quality)
        # Cases=15% (helpful but not essential for documented issues)
        # Logs=5% (nice to have but not required if KB is clear)
        base_confidence = int(
            (log_percentage * 0.05) +
            (case_percentage * 0.15) +
            (kb_percentage * 0.40) +
            (identifier_percentage * 0.20) +
            (evidence_percentage * 0.20)
        )
        
        # For now, use base confidence as total score
        # Impact and risk will be calculated separately in enhanced escalation logic
        total_score = base_confidence
        
        # Generate interpretations
        # Diagnosis confidence: based on identifiers, KB, logs, and evidence
        diagnosis_score = (identifier_percentage * 0.4) + (kb_percentage * 0.3) + (log_percentage * 0.15) + (evidence_percentage * 0.15)
        diagnosis_confidence = "HIGH" if diagnosis_score >= 70 else "MODERATE" if diagnosis_score >= 50 else "LOW"
        
        # Solution confidence: based primarily on KB (especially if has resolution procedures)
        solution_score = (kb_percentage * 0.6) + (case_percentage * 0.2) + (evidence_percentage * 0.2)
        solution_confidence = "HIGH" if solution_score >= 70 else "MODERATE" if solution_score >= 50 else "LOW"
        
        # Determine recommendation
        if total_score >= 70:
            recommendation = "PROCEED"
            recommendation_detail = "High confidence in both diagnosis and solution. Follow documented procedures carefully."
        elif total_score >= 50:
            recommendation = "PROCEED WITH CAUTION"
            recommendation_detail = "Moderate confidence. Verify each step and monitor results closely."
        elif total_score >= 30:
            recommendation = "INVESTIGATE FURTHER"
            recommendation_detail = "Limited evidence. Gather more information before proceeding."
        else:
            recommendation = "ESCALATE"
            recommendation_detail = "Insufficient evidence for confident diagnosis or resolution."
        
        return {
            "overall_score": total_score,
            "breakdown": {
                "log_evidence": {
                    "percentage": log_percentage,
                    "status": "excellent" if log_percentage >= 90 else "good" if log_percentage >= 70 else "moderate" if log_percentage >= 50 else "limited" if log_percentage > 0 else "none"
                },
                "past_cases": {
                    "percentage": case_percentage,
                    "status": "excellent" if case_percentage >= 90 else "good" if case_percentage >= 70 else "moderate" if case_percentage >= 50 else "limited" if case_percentage > 0 else "none"
                },
                "knowledge_base": {
                    "percentage": kb_percentage,
                    "status": "excellent" if kb_percentage >= 90 else "good" if kb_percentage >= 70 else "moderate" if kb_percentage >= 50 else "limited" if kb_percentage > 0 else "none"
                },
                "identifiers": {
                    "percentage": identifier_percentage,
                    "status": "excellent" if identifier_percentage >= 90 else "good" if identifier_percentage >= 70 else "moderate" if identifier_percentage >= 50 else "limited" if identifier_percentage > 0 else "none"
                },
                "evidence_quality": {
                    "percentage": evidence_percentage,
                    "status": "excellent" if evidence_percentage >= 90 else "good" if evidence_percentage >= 70 else "moderate" if evidence_percentage >= 50 else "limited" if evidence_percentage > 0 else "none"
                }
            },
            "interpretation": {
                "diagnosis_confidence": diagnosis_confidence,
                "diagnosis_explanation": self._get_diagnosis_explanation(diagnosis_confidence, identifier_percentage, kb_percentage, log_percentage, evidence_percentage),
                "solution_confidence": solution_confidence,
                "solution_explanation": self._get_solution_explanation(solution_confidence, kb_percentage, case_percentage, evidence_percentage),
                "recommendation": recommendation,
                "recommendation_detail": recommendation_detail
            }
        }
    
    def _get_diagnosis_explanation(self, confidence_level: str, identifier_percentage: int, kb_percentage: int, log_percentage: int, evidence_percentage: int) -> str:
        """Generate explanation for diagnosis confidence."""
        if confidence_level == "HIGH":
            if identifier_percentage == 100 and kb_percentage >= 85:
                return "Error code and identifiers clearly defined with matching KB documentation. Diagnosis is highly reliable."
            elif kb_percentage >= 85:
                return "Knowledge base provides clear documentation of this issue. High confidence in root cause identification."
            elif log_percentage >= 75 and evidence_percentage >= 75:
                return "Strong log evidence and detailed analysis support the diagnosis."
            else:
                return "Multiple evidence sources confirm the diagnosis with high confidence."
        elif confidence_level == "MODERATE":
            if kb_percentage >= 50:
                return "Related documentation found. Diagnosis is reasonable but may need verification during resolution."
            return "Some evidence supports diagnosis, but gaps exist. Verify findings during resolution."
        else:
            return "Limited diagnostic evidence. Root cause identification requires further investigation."
    
    def _get_solution_explanation(self, confidence_level: str, kb_percentage: int, case_percentage: int, evidence_percentage: int) -> str:
        """Generate explanation for solution confidence."""
        if confidence_level == "HIGH":
            if kb_percentage >= 85:
                return "Detailed resolution procedure documented in knowledge base with specific steps. Follow documented guidelines carefully."
            elif kb_percentage >= 70 and evidence_percentage >= 70:
                return "Clear resolution guidance available with strong supporting analysis. Solution approach is well-defined."
            elif case_percentage >= 75:
                return "Proven solution from similar past cases. Resolution approach has worked before."
            else:
                return "Good resolution guidance available from multiple sources."
        elif confidence_level == "MODERATE":
            if kb_percentage >= 50:
                return "General resolution guidance available. May need adaptation based on specific circumstances. Proceed carefully and verify results."
            elif case_percentage >= 40:
                return "Related solutions found in past cases. Resolution approach adapted from similar scenarios."
            return "Some resolution guidance available, but may need adaptation. Proceed carefully and verify results."
        else:
            return "Limited resolution guidance. Consider escalation or consult with senior engineers."

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

    def get_enhanced_escalation_decision(
        self,
        parsed: Dict,
        confidence_assessment: Dict,
        log_evidence: List[Dict],
        similar_cases: List[Dict],
        kb_articles: List[Dict],
        root_cause: Dict,
        kb_context: str,
        case_solutions: str,
    ) -> Dict:
        """
        Enhanced escalation decision using multi-factor analysis.
        
        Returns:
            Dict with escalation decision, impact assessment, severity, and justification
        """
        
        # Step 1: Calculate Impact Assessment
        impact_assessment = self.impact_assessor.calculate_impact_score(
            parsed_alert=parsed,
            log_evidence=log_evidence,
            similar_cases=similar_cases,
            kb_articles=kb_articles
        )
        
        # Step 2: Classify Severity
        severity_classification = self.severity_classifier.classify_severity(
            parsed_alert=parsed,
            impact_assessment=impact_assessment,
            gpt_analyzer=self
        )
        
        # Step 3: Generate Structured Metadata for GPT
        structured_metadata = self._generate_structured_metadata(
            parsed, confidence_assessment, impact_assessment, 
            severity_classification, log_evidence, similar_cases, kb_articles
        )
        
        # Step 4: Get GPT Resolution Decision with Enhanced Context
        resolution_decision = self._get_gpt_resolution_with_metadata(
            parsed, root_cause, kb_context, case_solutions, structured_metadata
        )
        
        # Step 5: Apply Enhanced Escalation Logic
        final_escalation_decision = self._apply_enhanced_escalation_logic(
            confidence_assessment, impact_assessment, severity_classification, resolution_decision
        )
        
        # Step 6: Generate Justification
        justification = self.justification_engine.generate_justification(
            escalation_decision=final_escalation_decision,
            confidence_assessment=confidence_assessment,
            impact_assessment=impact_assessment,
            severity_classification=severity_classification,
            parsed_alert=parsed,
            log_evidence=log_evidence,
            similar_cases=similar_cases,
            kb_articles=kb_articles
        )
        
        # Step 7: Record Decision for Learning
        incident_id = parsed.get("ticket_id", f"inc_{int(__import__('time').time())}")
        self.learning_feedback.record_escalation_decision(
            incident_id=incident_id,
            parsed_alert=parsed,
            confidence_assessment=confidence_assessment,
            impact_assessment=impact_assessment,
            severity_classification=severity_classification,
            escalation_decision=final_escalation_decision,
            justification=justification
        )
        
        return {
            "escalation_decision": final_escalation_decision,
            "impact_assessment": impact_assessment,
            "severity_classification": severity_classification,
            "justification": justification,
            "structured_metadata": structured_metadata,
            "learning_feedback_id": incident_id
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
{kb_context[:4000] if kb_context else "No KB context"}

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
    "time_breakdown": {{
        "resolution_steps_time": "X minutes",
        "verification_steps_time": "Y minutes", 
        "sql_commands_time": "Z minutes"
    }},
    "escalate": true/false,
    "escalate_to": "Module owner (Container/Vessel/EDI-API) or null",
    "escalate_reason": "why escalation is or isn't needed"
}}

IMPORTANT: The time breakdown should add up to the total estimated_time. For example:
- If estimated_time is "20 minutes", then X + Y + Z should equal 20
- If estimated_time is "45 minutes", then X + Y + Z should equal 45
- Allocate time realistically based on complexity of each section

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
                "time_breakdown": {
                    "resolution_steps_time": "Unknown",
                    "verification_steps_time": "Unknown",
                    "sql_commands_time": "Unknown"
                },
                "escalate": True,
                "escalate_to": "Product Team",
                "escalate_reason": "Unable to determine resolution automatically",
            }

    def _generate_structured_metadata(
        self,
        parsed: Dict,
        confidence_assessment: Dict,
        impact_assessment: Dict,
        severity_classification: Dict,
        log_evidence: List[Dict],
        similar_cases: List[Dict],
        kb_articles: List[Dict]
    ) -> Dict:
        """Generate structured metadata for GPT context."""
        
        # Calculate similarity scores
        past_case_similarity = similar_cases[0].get("relevance_score", 0) if similar_cases else 0
        kb_match_score = kb_articles[0].get("relevance_score", 0) if kb_articles else 0
        
        # Calculate recurrence rate (simplified)
        recurrence_rate = len(similar_cases) if similar_cases else 0
        
        # Determine customer reported
        alert_text = parsed.get("alert_text", "").lower()
        customer_reported = any(keyword in alert_text for keyword in [
            "customer reported", "customer service", "urgent", "critical"
        ])
        
        return {
            "incident_id": parsed.get("ticket_id", "unknown"),
            "error_code": parsed.get("error_code", ""),
            "module": parsed.get("module", ""),
            "error_message": parsed.get("alert_text", "")[:100],
            "log_evidence_score": len(log_evidence),
            "past_case_similarity": past_case_similarity,
            "kb_match_score": kb_match_score,
            "impact_score": impact_assessment.get("impact_score", 0),
            "confidence_score": confidence_assessment.get("overall_score", 0),
            "risk_level": severity_classification.get("severity", "Unknown"),
            "severity": severity_classification.get("severity", "Unknown"),
            "recurrence_rate": f"{recurrence_rate}/hour",
            "customer_reported": customer_reported,
            "previous_escalation_rate": 0.15  # Placeholder - would be calculated from historical data
        }
    
    def _get_gpt_resolution_with_metadata(
        self,
        parsed: Dict,
        root_cause: Dict,
        kb_context: str,
        case_solutions: str,
        structured_metadata: Dict
    ) -> Dict:
        """Get GPT resolution decision with enhanced structured context."""
        
        system_prompt = """You are an experienced duty officer deciding whether to escalate an incident.
        Use the structured metadata and historical patterns to make consistent, auditable decisions.
        Provide professional escalation recommendations without mentioning AI or GPT."""
        
        user_prompt = f"""Based on the metadata and historical patterns, decide:
        1. Should this be escalated? (Yes/No)
        2. If yes, to which team?
        3. Why?

        Metadata:
        {json.dumps(structured_metadata, indent=2)}

        Problem Details:
        {json.dumps(parsed, indent=2)}

        Root Cause:
        {json.dumps(root_cause, indent=2)}

        Knowledge Base Context:
        {kb_context[:2000] if kb_context else "No KB context"}

        Past Case Solutions:
        {case_solutions if case_solutions else "No past solutions found"}

        Provide your reasoning explicitly and return JSON:
        {{
            "escalate": true/false,
            "escalate_to": "Module owner (Container/Vessel/EDI-API) or null",
            "escalate_reason": "why escalation is or isn't needed",
            "estimated_time": "estimated time to resolve",
            "resolution_steps": ["step1", "step2", "step3"],
            "verification_steps": ["verify1", "verify2"],
            "sql_queries": ["query1", "query2"],
            "risk_assessment": "Low/Medium/High",
            "confidence_in_decision": "High/Medium/Low"
        }}

        Return ONLY valid JSON."""
        
        response = self._call_gpt(system_prompt, user_prompt, temperature=0.2)
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "escalate": True,
                "escalate_to": "Product Team",
                "escalate_reason": "Unable to determine resolution automatically",
                "estimated_time": "Unknown",
                "resolution_steps": ["Manual investigation required"],
                "verification_steps": [],
                "sql_queries": [],
                "risk_assessment": "High",
                "confidence_in_decision": "Low"
            }
    
    def _apply_enhanced_escalation_logic(
        self,
        confidence_assessment: Dict,
        impact_assessment: Dict,
        severity_classification: Dict,
        gpt_decision: Dict
    ) -> Dict:
        """Apply enhanced escalation logic combining confidence, impact, and severity."""
        
        confidence_score = confidence_assessment.get("overall_score", 0)
        impact_score = impact_assessment.get("impact_score", 0)
        severity = severity_classification.get("severity", "Unknown")
        
        # Extract GPT decision
        gpt_escalate = gpt_decision.get("escalate", False)
        gpt_escalate_to = gpt_decision.get("escalate_to", "")
        gpt_reason = gpt_decision.get("escalate_reason", "")
        
        # Enhanced escalation logic
        final_escalate = False
        final_escalate_to = ""
        final_reason = ""
        
        # Rule 1: Critical/High severity with any confidence -> Escalate
        if severity in ["Critical", "High"]:
            final_escalate = True
            final_escalate_to = gpt_escalate_to or "Product Team"
            final_reason = f"{severity} severity requires immediate escalation"
        
        # Rule 2: High impact (≥70) with low confidence (<50) -> Escalate
        elif impact_score >= 70 and confidence_score < 50:
            final_escalate = True
            final_escalate_to = gpt_escalate_to or "Product Team"
            final_reason = f"High impact ({impact_score}) with low confidence ({confidence_score}%) requires escalation"
        
        # Rule 3: Gray zone (30-50% confidence) -> Review required
        elif 30 <= confidence_score < 50:
            final_escalate = False
            final_escalate_to = ""
            final_reason = f"Gray zone confidence ({confidence_score}%) - review required"
            # Add review flag
            gpt_decision["needs_review"] = True
        
        # Rule 4: Very low confidence (<30%) -> Escalate
        elif confidence_score < 30:
            final_escalate = True
            final_escalate_to = gpt_escalate_to or "Product Team"
            final_reason = f"Very low confidence ({confidence_score}%) requires escalation"
        
        # Rule 5: AI recommendation with high confidence
        elif gpt_escalate and confidence_score >= 50:
            final_escalate = True
            final_escalate_to = gpt_escalate_to
            final_reason = f"It is recommended to escalate: {gpt_reason}"
        
        # Rule 6: Default to GPT decision
        else:
            final_escalate = gpt_escalate
            final_escalate_to = gpt_escalate_to
            final_reason = gpt_reason or f"Standard processing based on {confidence_score}% confidence"
        
        # Build final decision
        final_decision = {
            "escalate": final_escalate,
            "escalate_to": final_escalate_to,
            "escalate_reason": final_reason,
            "estimated_time": gpt_decision.get("estimated_time", "Unknown"),
            "resolution_steps": gpt_decision.get("resolution_steps", []),
            "verification_steps": gpt_decision.get("verification_steps", []),
            "sql_queries": gpt_decision.get("sql_queries", []),
            "risk_assessment": gpt_decision.get("risk_assessment", "Medium"),
            "confidence_in_decision": gpt_decision.get("confidence_in_decision", "Medium"),
            "needs_review": gpt_decision.get("needs_review", False),
            
            # Enhanced metadata
            "escalation_logic": {
                "confidence_score": confidence_score,
                "impact_score": impact_score,
                "severity": severity,
                "ai_recommendation": gpt_escalate,
                "final_decision": final_escalate,
                "decision_factors": [
                    f"Confidence: {confidence_score}%",
                    f"Impact: {impact_score}",
                    f"Severity: {severity}",
                    f"Recommendation: {'Escalate' if gpt_escalate else 'No escalation'}"
                ]
            }
        }
        
        return final_decision

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
