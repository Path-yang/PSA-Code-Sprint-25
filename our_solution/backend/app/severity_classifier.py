"""
Severity Classification Module
Hybrid rule-based + GPT approach for severity classification.
"""

import json
from typing import Dict, List, Optional


class SeverityClassifier:
    """Classify incident severity using rule-based baseline + GPT refinement."""
    
    def __init__(self):
        """Initialize severity classification rules."""
        
        # Base Classification Rules (deterministic)
        self.severity_rules = {
            # Critical - System-wide failures
            "DB_CONN_FAIL": "Critical",
            "SYSTEM_DOWN": "Critical",
            "DATABASE_LOCK": "Critical",
            "MEMORY_EXHAUSTION": "Critical",
            
            # High - Core business operations
            "VESSEL_ERR_4": "High",
            "VESSEL_ERR_1": "High", 
            "VESSEL_ERR_2": "High",
            "VESSEL_ERR_3": "High",
            "CONTAINER_ERR_1": "High",
            "CONTAINER_ERR_2": "High",
            "EDI_ERR_1": "High",
            "EDI_ERR_2": "High",
            
            # Medium - Service degradation
            "API_TIMEOUT": "Medium",
            "API_ERR_500": "Medium",
            "API_ERR_502": "Medium", 
            "API_ERR_503": "Medium",
            "EDI_TIMEOUT": "Medium",
            "VESSEL_ERR_5": "Medium",
            "CONTAINER_ERR_3": "Medium",
            
            # Low - Warnings and minor issues
            "API_LATENCY_WARN": "Low",
            "LOG_WARN": "Low",
            "PERF_WARN": "Low",
            "CACHE_MISS": "Low",
        }
        
        # Module-based severity modifiers
        self.module_severity_modifiers = {
            "Database": +1,  # Upgrade severity by 1 level
            "Vessel": 0,     # No change
            "Container": 0,  # No change
            "EDI": 0,       # No change
            "API": -1,      # Downgrade severity by 1 level
        }
        
        # Severity hierarchy for level changes
        self.severity_levels = ["Low", "Medium", "High", "Critical"]
    
    def classify_severity(
        self,
        parsed_alert: Dict,
        impact_assessment: Dict,
        gpt_analyzer=None
    ) -> Dict:
        """
        Classify severity using hybrid approach.
        
        Args:
            parsed_alert: Parsed alert data
            impact_assessment: Impact assessment results
            gpt_analyzer: GPT analyzer instance for refinement
            
        Returns:
            Dict with severity classification and reasoning
        """
        # Step 1: Base Classification (Rule-based)
        base_severity = self._get_base_severity(parsed_alert)
        
        # Step 2: Apply Module Modifiers
        adjusted_severity = self._apply_module_modifiers(base_severity, parsed_alert)
        
        # Step 3: GPT Refinement (if available)
        if gpt_analyzer:
            final_severity = self._gpt_refine_severity(
                parsed_alert, 
                adjusted_severity, 
                impact_assessment,
                gpt_analyzer
            )
        else:
            final_severity = adjusted_severity
        
        return {
            "severity": final_severity,
            "base_severity": base_severity,
            "adjusted_severity": adjusted_severity,
            "classification_method": "hybrid" if gpt_analyzer else "rule_based",
            "escalation_timeline": self._get_escalation_timeline(final_severity),
            "reasoning": self._generate_reasoning(parsed_alert, base_severity, final_severity)
        }
    
    def _get_base_severity(self, parsed_alert: Dict) -> str:
        """Get base severity from error code rules."""
        error_code = parsed_alert.get("error_code", "")
        
        # Direct rule match
        if error_code in self.severity_rules:
            return self.severity_rules[error_code]
        
        # Pattern matching for similar error codes
        if error_code:  # Only if error_code is not None
            for pattern, severity in self.severity_rules.items():
                if error_code.startswith(pattern.split("_")[0]):
                    return severity
        
        # Default based on module
        module = parsed_alert.get("module", "")
        if module in ["Database", "System"]:
            return "High"
        elif module in ["Vessel", "Container"]:
            return "Medium"
        else:
            return "Low"
    
    def _apply_module_modifiers(self, base_severity: str, parsed_alert: Dict) -> str:
        """Apply module-based severity modifiers."""
        module = parsed_alert.get("module", "")
        modifier = self.module_severity_modifiers.get(module, 0)
        
        if modifier == 0:
            return base_severity
        
        current_index = self.severity_levels.index(base_severity)
        new_index = current_index + modifier
        
        # Clamp to valid range
        new_index = max(0, min(len(self.severity_levels) - 1, new_index))
        
        return self.severity_levels[new_index]
    
    def _gpt_refine_severity(
        self,
        parsed_alert: Dict,
        current_severity: str,
        impact_assessment: Dict,
        gpt_analyzer
    ) -> str:
        """Use GPT to refine severity classification for contextual cases."""
        
        system_prompt = """You are an incident severity classifier. 
        Your job is to determine if the current severity classification should be adjusted based on context.
        
        Consider:
        - The specific error and its business impact
        - Customer urgency indicators
        - System criticality
        - Transaction context
        
        Respond with ONLY: "Low", "Medium", "High", or "Critical"
        """
        
        user_prompt = f"""Current severity classification: {current_severity}
        
        Alert details:
        - Error code: {parsed_alert.get('error_code', 'None')}
        - Module: {parsed_alert.get('module', 'None')}
        - Entity: {parsed_alert.get('entity_id', 'None')}
        - Alert text: {parsed_alert.get('alert_text', '')[:200]}...
        
        Impact assessment:
        - Impact score: {impact_assessment.get('impact_score', 0)}
        - Severity: {impact_assessment.get('severity', 'Unknown')}
        
        Based on this context, should the severity be adjusted?
        Consider if this is a routine issue, service degradation, or critical failure.
        
        Respond with the appropriate severity level:"""
        
        try:
            response = gpt_analyzer._call_gpt(system_prompt, user_prompt, temperature=0.1)
            refined_severity = response.strip()
            
            # Validate response
            if refined_severity in self.severity_levels:
                return refined_severity
            else:
                return current_severity  # Fallback to current
                
        except Exception as e:
            print(f"GPT severity refinement failed: {e}")
            return current_severity  # Fallback to current
    
    def _get_escalation_timeline(self, severity: str) -> str:
        """Get escalation timeline based on severity."""
        timelines = {
            "Critical": "Immediate escalation",
            "High": "Escalate within 15 min", 
            "Medium": "Log and monitor",
            "Low": "No escalation"
        }
        return timelines.get(severity, "Log and monitor")
    
    def _generate_reasoning(
        self, 
        parsed_alert: Dict, 
        base_severity: str, 
        final_severity: str
    ) -> str:
        """Generate human-readable reasoning for severity classification."""
        error_code = parsed_alert.get("error_code", "")
        module = parsed_alert.get("module", "")
        
        reasoning_parts = []
        
        # Base classification reasoning
        if error_code in self.severity_rules:
            reasoning_parts.append(f"Error code '{error_code}' mapped to {base_severity} severity")
        else:
            reasoning_parts.append(f"Default {base_severity} severity for {module} module")
        
        # Module modifier reasoning
        modifier = self.module_severity_modifiers.get(module, 0)
        if modifier > 0:
            reasoning_parts.append(f"Upgraded due to {module} module criticality")
        elif modifier < 0:
            reasoning_parts.append(f"Downgraded due to {module} module lower priority")
        
        # Final classification
        if base_severity != final_severity:
            reasoning_parts.append(f"Final severity: {final_severity}")
        
        return "; ".join(reasoning_parts)
