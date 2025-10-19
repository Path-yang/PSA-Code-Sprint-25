"""
Impact Assessment Module
Calculates business impact scores using multi-factor heuristic model.
"""

import re
from typing import Dict, List, Optional
from datetime import datetime, timedelta


class ImpactAssessor:
    """Assess business impact of incidents using rule-based and contextual factors."""
    
    def __init__(self):
        """Initialize impact assessment rules and weights."""
        
        # Error Code Severity Mapping (+40 points)
        self.error_severity_map = {
            # Critical errors (affects core operations)
            "DB_CONN_FAIL": 40,
            "VESSEL_ERR_4": 40,  # Vessel scheduling impact
            "CONTAINER_ERR_1": 40,  # Container operations
            "EDI_ERR_1": 40,  # EDI message processing
            
            # High impact errors
            "VESSEL_ERR_1": 35,
            "VESSEL_ERR_2": 35,
            "VESSEL_ERR_3": 35,
            "CONTAINER_ERR_2": 35,
            "CONTAINER_ERR_3": 35,
            "EDI_ERR_2": 35,
            "EDI_ERR_3": 35,
            
            # Medium impact errors
            "API_TIMEOUT": 25,
            "API_ERR_500": 25,
            "API_ERR_502": 25,
            "API_ERR_503": 25,
            "EDI_TIMEOUT": 25,
            
            # Low impact errors
            "API_LATENCY_WARN": 10,
            "LOG_WARN": 5,
            "PERF_WARN": 5,
        }
        
        # Module Criticality Ranking (+25 points)
        self.module_criticality = {
            "Vessel": 25,
            "Container": 20,
            "EDI": 15,
            "API": 10,
            "Database": 30,  # Highest criticality
            "System": 20,
        }
        
        # Customer Mention Keywords (+20 points)
        self.customer_keywords = [
            "customer reported", "customer service", "urgent", "cannot proceed",
            "blocking", "critical", "immediate", "asap", "emergency",
            "customer complaint", "customer impact", "business impact"
        ]
        
        # Transaction Context Keywords (+15 points)
        self.transaction_keywords = [
            "unable to create", "failed to process", "transaction failed",
            "cannot complete", "blocked", "stuck", "timeout", "error",
            "vessel advice", "berth booking", "container booking"
        ]
        
        # Impact thresholds
        self.impact_thresholds = {
            "high": 70,      # Immediate escalation
            "medium": 40,    # Monitor or review
            "low": 0         # Routine
        }
    
    def calculate_impact_score(
        self,
        parsed_alert: Dict,
        log_evidence: List[Dict],
        similar_cases: List[Dict],
        kb_articles: List[Dict]
    ) -> Dict:
        """
        Calculate comprehensive impact score using multi-factor model.
        
        Returns:
            Dict with impact_score, breakdown, and severity classification
        """
        impact_score = 0
        breakdown = {}
        
        # Factor 1: Error Code Severity (+40 points)
        error_code = parsed_alert.get("error_code", "")
        error_impact = self.error_severity_map.get(error_code, 0)
        impact_score += error_impact
        breakdown["error_code_severity"] = {
            "score": error_impact,
            "max_score": 40,
            "details": f"Error code '{error_code}' mapped to {error_impact} points"
        }
        
        # Factor 2: Module Criticality (+25 points)
        module = parsed_alert.get("module", "")
        module_impact = self.module_criticality.get(module, 10)  # Default to API level
        impact_score += module_impact
        breakdown["module_criticality"] = {
            "score": module_impact,
            "max_score": 25,
            "details": f"Module '{module}' has {module_impact} points criticality"
        }
        
        # Factor 3: Customer Mentions (+20 points)
        alert_text = parsed_alert.get("alert_text", "").lower()
        customer_impact = 0
        customer_mentions = []
        
        for keyword in self.customer_keywords:
            if keyword in alert_text:
                customer_impact += 5  # Each keyword adds 5 points, max 20
                customer_mentions.append(keyword)
        
        customer_impact = min(customer_impact, 20)  # Cap at 20
        impact_score += customer_impact
        breakdown["customer_mentions"] = {
            "score": customer_impact,
            "max_score": 20,
            "details": f"Found customer keywords: {customer_mentions}" if customer_mentions else "No customer urgency indicators"
        }
        
        # Factor 4: Frequency/Recurrence (+10 points)
        recurrence_impact = self._calculate_recurrence_impact(parsed_alert, similar_cases)
        impact_score += recurrence_impact
        breakdown["recurrence"] = {
            "score": recurrence_impact,
            "max_score": 10,
            "details": f"Recurrence analysis: {recurrence_impact} points"
        }
        
        # Factor 5: Transaction Context (+15 points)
        transaction_impact = 0
        transaction_indicators = []
        
        for keyword in self.transaction_keywords:
            if keyword in alert_text:
                transaction_impact += 3  # Each keyword adds 3 points, max 15
                transaction_indicators.append(keyword)
        
        transaction_impact = min(transaction_impact, 15)  # Cap at 15
        impact_score += transaction_impact
        breakdown["transaction_context"] = {
            "score": transaction_impact,
            "max_score": 15,
            "details": f"Transaction indicators: {transaction_indicators}" if transaction_indicators else "No transaction failure indicators"
        }
        
        # Determine severity classification
        severity = self._classify_severity(impact_score)
        
        return {
            "impact_score": min(impact_score, 100),  # Cap at 100
            "severity": severity,
            "breakdown": breakdown,
            "total_factors": 5,
            "max_possible_score": 110  # Sum of all max scores
        }
    
    def _calculate_recurrence_impact(self, parsed_alert: Dict, similar_cases: List[Dict]) -> int:
        """Calculate impact based on frequency/recurrence of similar issues."""
        if not similar_cases:
            return 0
        
        # Count similar cases in last 24 hours (simplified)
        recent_cases = len([case for case in similar_cases 
                          if case.get("relevance_score", 0) > 0.7])
        
        if recent_cases >= 3:
            return 10  # High recurrence
        elif recent_cases >= 2:
            return 7   # Medium recurrence
        elif recent_cases >= 1:
            return 3   # Low recurrence
        else:
            return 0   # No recent recurrence
    
    def _classify_severity(self, impact_score: int) -> str:
        """Classify severity based on impact score."""
        if impact_score >= self.impact_thresholds["high"]:
            return "Critical"
        elif impact_score >= self.impact_thresholds["medium"]:
            return "High"
        elif impact_score >= 20:
            return "Medium"
        else:
            return "Low"
    
    def get_escalation_timeline(self, severity: str) -> str:
        """Get escalation timeline based on severity."""
        timelines = {
            "Critical": "Immediate escalation",
            "High": "Escalate within 15 min",
            "Medium": "Log and monitor",
            "Low": "No escalation"
        }
        return timelines.get(severity, "Log and monitor")
    
    def should_escalate_by_impact(self, impact_score: int, severity: str) -> bool:
        """Determine if escalation is needed based on impact."""
        if severity in ["Critical", "High"]:
            return True
        elif severity == "Medium" and impact_score >= 50:
            return True
        else:
            return False
