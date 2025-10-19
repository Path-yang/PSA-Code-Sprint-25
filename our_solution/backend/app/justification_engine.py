"""
Justification Engine Module
Provides structured explanations for escalation decisions.
"""

from typing import Dict, List, Optional


class JustificationEngine:
    """Generate structured explanations for escalation decisions."""
    
    def __init__(self):
        """Initialize justification engine."""
        pass
    
    def generate_justification(
        self,
        escalation_decision: Dict,
        confidence_assessment: Dict,
        impact_assessment: Dict,
        severity_classification: Dict,
        parsed_alert: Dict,
        log_evidence: List[Dict],
        similar_cases: List[Dict],
        kb_articles: List[Dict]
    ) -> Dict:
        """
        Generate comprehensive justification for escalation decision.
        
        Returns:
            Dict with structured justification breakdown
        """
        
        # Extract key decision factors
        escalate = escalation_decision.get("escalate", False)
        escalate_to = escalation_decision.get("escalate_to", "None")
        escalate_reason = escalation_decision.get("escalate_reason", "")
        
        confidence_score = confidence_assessment.get("overall_score", 0)
        impact_score = impact_assessment.get("impact_score", 0)
        severity = severity_classification.get("severity", "Unknown")
        
        # Generate factor-by-factor justification
        justification = {
            "decision_summary": {
                "escalate": escalate,
                "escalate_to": escalate_to,
                "primary_reason": escalate_reason,
                "confidence_score": confidence_score,
                "impact_score": impact_score,
                "severity": severity
            },
            
            "factor_breakdown": {
                "log_evidence": self._justify_log_evidence(log_evidence, confidence_score),
                "past_cases": self._justify_past_cases(similar_cases, confidence_score),
                "knowledge_base": self._justify_knowledge_base(kb_articles, confidence_score),
                "impact_assessment": self._justify_impact_assessment(impact_assessment),
                "severity_classification": self._justify_severity_classification(severity_classification)
            },
            
            "risk_assessment": self._generate_risk_assessment(
                parsed_alert, impact_score, severity, escalate
            ),
            
            "recommendation_rationale": self._generate_recommendation_rationale(
                escalate, confidence_score, impact_score, severity, escalate_reason
            )
        }
        
        return justification
    
    def _justify_log_evidence(self, log_evidence: List[Dict], confidence_score: int) -> Dict:
        """Justify log evidence contribution to decision."""
        log_count = len(log_evidence)
        
        if log_count == 0:
            return {
                "status": "none",
                "explanation": "No log evidence found",
                "impact": "Reduces confidence in diagnosis",
                "score_contribution": "0%"
            }
        elif log_count < 3:
            return {
                "status": "limited", 
                "explanation": f"Found {log_count} log entries",
                "impact": "Limited evidence for root cause analysis",
                "score_contribution": "Low"
            }
        elif log_count < 10:
            return {
                "status": "moderate",
                "explanation": f"Found {log_count} log entries with relevant patterns",
                "impact": "Good evidence for diagnosis",
                "score_contribution": "Medium"
            }
        else:
            return {
                "status": "excellent",
                "explanation": f"Found {log_count} log entries with clear patterns",
                "impact": "Strong evidence for root cause identification",
                "score_contribution": "High"
            }
    
    def _justify_past_cases(self, similar_cases: List[Dict], confidence_score: int) -> Dict:
        """Justify past cases contribution to decision."""
        case_count = len(similar_cases)
        
        if case_count == 0:
            return {
                "status": "none",
                "explanation": "No similar past cases found",
                "impact": "No historical precedent for resolution approach",
                "score_contribution": "0%"
            }
        
        # Get best match relevance
        best_relevance = similar_cases[0].get("relevance_score", 0) if similar_cases else 0
        
        if best_relevance >= 0.8:
            return {
                "status": "excellent",
                "explanation": f"Found {case_count} cases with {best_relevance:.0%} similarity",
                "impact": "Exact match provides proven resolution path",
                "score_contribution": "High"
            }
        elif best_relevance >= 0.6:
            return {
                "status": "good",
                "explanation": f"Found {case_count} cases with {best_relevance:.0%} similarity",
                "impact": "Good precedent for resolution approach",
                "score_contribution": "Medium"
            }
        else:
            return {
                "status": "limited",
                "explanation": f"Found {case_count} cases with {best_relevance:.0%} similarity",
                "impact": "Some precedent but may need adaptation",
                "score_contribution": "Low"
            }
    
    def _justify_knowledge_base(self, kb_articles: List[Dict], confidence_score: int) -> Dict:
        """Justify knowledge base contribution to decision."""
        kb_count = len(kb_articles)
        
        if kb_count == 0:
            return {
                "status": "none",
                "explanation": "No knowledge base articles found",
                "impact": "No documented procedures available",
                "score_contribution": "0%"
            }
        
        # Check if articles have resolution procedures
        has_resolution = any(
            "Resolution" in article.get("content", "") or 
            "Verification" in article.get("content", "")
            for article in kb_articles[:3]
        )
        
        if has_resolution:
            return {
                "status": "excellent",
                "explanation": f"Found {kb_count} articles with resolution procedures",
                "impact": "Clear documented steps for resolution",
                "score_contribution": "High"
            }
        else:
            return {
                "status": "moderate",
                "explanation": f"Found {kb_count} articles but limited resolution guidance",
                "impact": "Some documentation but may need adaptation",
                "score_contribution": "Medium"
            }
    
    def _justify_impact_assessment(self, impact_assessment: Dict) -> Dict:
        """Justify impact assessment contribution to decision."""
        impact_score = impact_assessment.get("impact_score", 0)
        severity = impact_assessment.get("severity", "Unknown")
        
        breakdown = impact_assessment.get("breakdown", {})
        
        # Summarize impact factors
        factors = []
        for factor, details in breakdown.items():
            score = details.get("score", 0)
            max_score = details.get("max_score", 0)
            if score > 0:
                factors.append(f"{factor}: {score}/{max_score}")
        
        return {
            "impact_score": impact_score,
            "severity": severity,
            "contributing_factors": factors,
            "business_impact": self._assess_business_impact(impact_score, severity),
            "escalation_threshold": "Met" if impact_score >= 70 else "Not met"
        }
    
    def _justify_severity_classification(self, severity_classification: Dict) -> Dict:
        """Justify severity classification contribution to decision."""
        severity = severity_classification.get("severity", "Unknown")
        base_severity = severity_classification.get("base_severity", "Unknown")
        reasoning = severity_classification.get("reasoning", "")
        
        return {
            "final_severity": severity,
            "base_severity": base_severity,
            "classification_method": severity_classification.get("classification_method", "rule_based"),
            "reasoning": reasoning,
            "escalation_timeline": severity_classification.get("escalation_timeline", "Unknown")
        }
    
    def _generate_risk_assessment(
        self, 
        parsed_alert: Dict, 
        impact_score: int, 
        severity: str, 
        escalate: bool
    ) -> Dict:
        """Generate risk assessment for the decision."""
        
        # Assess operational risk
        if severity in ["Critical", "High"]:
            operational_risk = "High - Potential for significant business impact"
        elif severity == "Medium":
            operational_risk = "Medium - Service degradation possible"
        else:
            operational_risk = "Low - Minimal business impact"
        
        # Assess escalation risk
        if escalate:
            escalation_risk = "Low - Appropriate escalation reduces resolution time"
        else:
            escalation_risk = "Medium - Risk of delayed resolution if issue escalates"
        
        return {
            "operational_risk": operational_risk,
            "escalation_risk": escalation_risk,
            "recommended_action": "Escalate immediately" if escalate else "Monitor and resolve",
            "risk_factors": self._identify_risk_factors(parsed_alert, impact_score)
        }
    
    def _generate_recommendation_rationale(
        self, 
        escalate: bool, 
        confidence_score: int, 
        impact_score: int, 
        severity: str, 
        escalate_reason: str
    ) -> Dict:
        """Generate rationale for the recommendation."""
        
        rationale_parts = []
        
        # Confidence-based rationale
        if confidence_score < 30:
            rationale_parts.append("Low confidence (<30%) indicates insufficient evidence for autonomous resolution")
        elif confidence_score < 50:
            rationale_parts.append("Moderate confidence (30-50%) suggests need for additional validation")
        else:
            rationale_parts.append(f"Confidence score ({confidence_score}%) supports autonomous resolution")
        
        # Impact-based rationale
        if impact_score >= 70:
            rationale_parts.append("High impact score (≥70) indicates significant business risk")
        elif impact_score >= 40:
            rationale_parts.append("Medium impact score (40-69) suggests monitoring required")
        else:
            rationale_parts.append("Low impact score (<40) indicates routine handling appropriate")
        
        # Severity-based rationale
        if severity in ["Critical", "High"]:
            rationale_parts.append(f"{severity} severity requires immediate attention")
        elif severity == "Medium":
            rationale_parts.append("Medium severity allows for standard resolution timeline")
        else:
            rationale_parts.append("Low severity permits routine handling")
        
        return {
            "primary_rationale": escalate_reason,
            "supporting_factors": rationale_parts,
            "decision_confidence": "High" if confidence_score >= 70 else "Medium" if confidence_score >= 50 else "Low"
        }
    
    def _assess_business_impact(self, impact_score: int, severity: str) -> str:
        """Assess business impact based on score and severity."""
        if impact_score >= 70 or severity == "Critical":
            return "Critical - Immediate business impact, potential revenue loss"
        elif impact_score >= 40 or severity == "High":
            return "High - Significant operational impact, customer service degradation"
        elif impact_score >= 20 or severity == "Medium":
            return "Medium - Moderate impact, some service degradation"
        else:
            return "Low - Minimal impact, routine operational issue"
    
    def _identify_risk_factors(self, parsed_alert: Dict, impact_score: int) -> List[str]:
        """Identify specific risk factors from the alert."""
        risk_factors = []
        
        alert_text = parsed_alert.get("alert_text", "").lower()
        error_code = parsed_alert.get("error_code", "")
        module = parsed_alert.get("module", "")
        
        # Error-based risks
        if error_code:  # Only if error_code is not None
            if "vessel" in error_code.lower():
                risk_factors.append("Vessel scheduling disruption")
            if "container" in error_code.lower():
                risk_factors.append("Container operations impact")
            if "edi" in error_code.lower():
                risk_factors.append("EDI message processing failure")
            if "database" in error_code.lower():
                risk_factors.append("Database connectivity issues")
        
        # Module-based risks
        if module == "Vessel":
            risk_factors.append("Port operations dependency")
        elif module == "Container":
            risk_factors.append("Cargo handling impact")
        elif module == "EDI":
            risk_factors.append("External partner communication")
        
        # Context-based risks
        if "customer" in alert_text:
            risk_factors.append("Customer service impact")
        if "urgent" in alert_text or "critical" in alert_text:
            risk_factors.append("Time-sensitive resolution required")
        
        return risk_factors if risk_factors else ["Standard operational risk"]
