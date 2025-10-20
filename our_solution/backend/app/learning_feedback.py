"""
Learning Feedback Module
Captures escalation decisions and outcomes for continuous improvement.
"""

import json
from typing import Dict, List, Optional
from datetime import datetime


class LearningFeedback:
    """Capture and analyze escalation feedback for continuous improvement."""
    
    def __init__(self):
        """Initialize learning feedback system."""
        self.feedback_hooks = []
    
    def record_escalation_decision(
        self,
        incident_id: str,
        parsed_alert: Dict,
        confidence_assessment: Dict,
        impact_assessment: Dict,
        severity_classification: Dict,
        escalation_decision: Dict,
        justification: Dict
    ) -> Dict:
        """
        Record escalation decision for future analysis.
        
        Returns:
            Dict with decision record and feedback ID
        """
        
        decision_record = {
            "incident_id": incident_id,
            "timestamp": datetime.now().isoformat(),
            
            # Input factors
            "input_factors": {
                "error_code": parsed_alert.get("error_code", ""),
                "module": parsed_alert.get("module", ""),
                "entity_id": parsed_alert.get("entity_id", ""),
                "channel": parsed_alert.get("channel", ""),
                "symptoms": parsed_alert.get("symptoms", [])
            },
            
            # Assessment results
            "assessments": {
                "confidence_score": confidence_assessment.get("overall_score", 0),
                "confidence_breakdown": confidence_assessment.get("breakdown", {}),
                "impact_score": impact_assessment.get("impact_score", 0),
                "impact_severity": impact_assessment.get("severity", ""),
                "severity_classification": severity_classification.get("severity", ""),
                "severity_method": severity_classification.get("classification_method", "")
            },
            
            # Decision
            "escalation_decision": {
                "escalate": escalation_decision.get("escalate", False),
                "escalate_to": escalation_decision.get("escalate_to", ""),
                "escalate_reason": escalation_decision.get("escalate_reason", ""),
                "estimated_time": escalation_decision.get("estimated_time", ""),
                "resolution_steps": escalation_decision.get("resolution_steps", [])
            },
            
            # Justification
            "justification": justification,
            
            # Feedback tracking
            "feedback_status": "pending",
            "feedback_id": f"fb_{incident_id}_{int(datetime.now().timestamp())}"
        }
        
        # Store decision record (placeholder for now)
        self._store_decision_record(decision_record)
        
        # Trigger feedback hooks
        self._trigger_feedback_hooks(decision_record)
        
        return {
            "feedback_id": decision_record["feedback_id"],
            "status": "recorded",
            "next_steps": "Awaiting resolution outcome for feedback"
        }
    
    def record_resolution_outcome(
        self,
        feedback_id: str,
        final_outcome: Dict
    ) -> Dict:
        """
        Record resolution outcome for learning.
        
        Args:
            feedback_id: ID from record_escalation_decision
            final_outcome: Dict with resolution details
            
        Returns:
            Dict with learning analysis
        """
        
        outcome_record = {
            "feedback_id": feedback_id,
            "timestamp": datetime.now().isoformat(),
            
            # Resolution details
            "resolution_outcome": {
                "resolved_by": final_outcome.get("resolved_by", "unknown"),
                "resolution_time": final_outcome.get("resolution_time", ""),
                "resolution_method": final_outcome.get("resolution_method", ""),
                "success": final_outcome.get("success", True),
                "escalation_was_needed": final_outcome.get("escalation_was_needed", True),
                "actual_escalate_to": final_outcome.get("actual_escalate_to", ""),
                "notes": final_outcome.get("notes", "")
            },
            
            # Learning analysis
            "learning_analysis": self._analyze_outcome(feedback_id, final_outcome)
        }
        
        # Store outcome record
        self._store_outcome_record(outcome_record)
        
        return {
            "feedback_id": feedback_id,
            "status": "outcome_recorded",
            "learning_insights": outcome_record["learning_analysis"]
        }
    
    def get_escalation_patterns(self, days: int = 30) -> Dict:
        """
        Analyze escalation patterns for insights.
        
        Args:
            days: Number of days to analyze
            
        Returns:
            Dict with pattern analysis
        """
        
        # Placeholder for pattern analysis
        # In production, this would query the feedback database
        
        patterns = {
            "analysis_period": f"Last {days} days",
            "total_decisions": 0,  # Would be actual count
            "escalation_rate": 0.0,  # Would be actual rate
            "false_positives": 0,  # Escalated but not needed
            "false_negatives": 0,  # Not escalated but should have been
            "accuracy_rate": 0.0,
            
            "common_escalation_triggers": [
                "Low confidence score (<30%)",
                "High impact score (≥70)",
                "Critical severity classification"
            ],
            
            "module_escalation_rates": {
                "Vessel": 0.0,
                "Container": 0.0,
                "EDI": 0.0,  # Legacy
                "EDI/API": 0.0,
                "API": 0.0
            },
            
            "recommendations": [
                "Consider adjusting confidence thresholds for Vessel module",
                "Improve knowledge base coverage for EDI errors",
                "Add more specific error code mappings"
            ]
        }
        
        return patterns
    
    def suggest_threshold_adjustments(self) -> Dict:
        """
        Suggest threshold adjustments based on feedback.
        
        Returns:
            Dict with suggested adjustments
        """
        
        # Placeholder for threshold analysis
        # In production, this would analyze historical feedback
        
        suggestions = {
            "confidence_thresholds": {
                "current": {
                    "escalate": 30,
                    "investigate": 50,
                    "proceed": 70
                },
                "suggested": {
                    "escalate": 25,  # Lower threshold for more escalations
                    "investigate": 45,
                    "proceed": 75
                },
                "reasoning": "Based on feedback, current thresholds miss some cases that should be escalated"
            },
            
            "impact_thresholds": {
                "current": {
                    "high": 70,
                    "medium": 40,
                    "low": 0
                },
                "suggested": {
                    "high": 65,  # Lower threshold for high impact
                    "medium": 35,
                    "low": 0
                },
                "reasoning": "Impact assessment is conservative, lowering thresholds improves detection"
            },
            
            "module_weights": {
                "current": {
                    "Vessel": 25,
                    "Container": 20,
                    "EDI": 15,  # Legacy
                    "EDI/API": 15,
                    "API": 10
                },
                "suggested": {
                    "Vessel": 30,  # Increase vessel criticality
                    "Container": 20,
                    "EDI": 18,     # Legacy - Increase EDI criticality
                    "EDI/API": 18,  # Increase EDI/API criticality
                    "API": 10
                },
                "reasoning": "Vessel and EDI/API modules have higher business impact than initially assessed"
            }
        }
        
        return suggestions
    
    def _store_decision_record(self, decision_record: Dict) -> None:
        """Store decision record (placeholder implementation)."""
        # In production, this would store to database
        print(f"📊 Stored escalation decision: {decision_record['feedback_id']}")
        pass
    
    def _store_outcome_record(self, outcome_record: Dict) -> None:
        """Store outcome record (placeholder implementation)."""
        # In production, this would store to database
        print(f"📈 Stored resolution outcome: {outcome_record['feedback_id']}")
        pass
    
    def _trigger_feedback_hooks(self, decision_record: Dict) -> None:
        """Trigger registered feedback hooks."""
        for hook in self.feedback_hooks:
            try:
                hook(decision_record)
            except Exception as e:
                print(f"Feedback hook error: {e}")
    
    def _analyze_outcome(self, feedback_id: str, final_outcome: Dict) -> Dict:
        """Analyze outcome for learning insights."""
        
        # Determine if escalation decision was correct
        escalation_was_needed = final_outcome.get("escalation_was_needed", True)
        success = final_outcome.get("success", True)
        
        # Calculate decision accuracy
        if escalation_was_needed and success:
            decision_accuracy = "correct_escalation"
        elif not escalation_was_needed and success:
            decision_accuracy = "correct_no_escalation"
        elif escalation_was_needed and not success:
            decision_accuracy = "incorrect_no_escalation"
        else:
            decision_accuracy = "incorrect_escalation"
        
        return {
            "decision_accuracy": decision_accuracy,
            "escalation_effectiveness": "effective" if success else "ineffective",
            "learning_insights": self._generate_learning_insights(decision_accuracy, final_outcome),
            "improvement_suggestions": self._generate_improvement_suggestions(decision_accuracy, final_outcome)
        }
    
    def _generate_learning_insights(self, decision_accuracy: str, final_outcome: Dict) -> List[str]:
        """Generate learning insights from outcome analysis."""
        insights = []
        
        if decision_accuracy == "correct_escalation":
            insights.append("Escalation decision was appropriate and effective")
        elif decision_accuracy == "correct_no_escalation":
            insights.append("No escalation was the right choice")
        elif decision_accuracy == "incorrect_no_escalation":
            insights.append("Should have escalated - confidence/impact thresholds may be too high")
        elif decision_accuracy == "incorrect_escalation":
            insights.append("Escalation was unnecessary - thresholds may be too low")
        
        # Add specific insights based on outcome
        resolution_time = final_outcome.get("resolution_time", "")
        if resolution_time and "min" in resolution_time:
            time_minutes = int(resolution_time.split()[0])
            if time_minutes > 60:
                insights.append("Resolution took longer than expected - consider escalation")
        
        return insights
    
    def _generate_improvement_suggestions(self, decision_accuracy: str, final_outcome: Dict) -> List[str]:
        """Generate improvement suggestions from outcome analysis."""
        suggestions = []
        
        if decision_accuracy == "incorrect_no_escalation":
            suggestions.append("Lower confidence threshold for escalation")
            suggestions.append("Increase impact score weight in decision")
        elif decision_accuracy == "incorrect_escalation":
            suggestions.append("Raise confidence threshold for escalation")
            suggestions.append("Improve knowledge base coverage")
        
        # Module-specific suggestions
        resolved_by = final_outcome.get("resolved_by", "")
        if "specialist" in resolved_by.lower():
            suggestions.append("Consider adding specialist escalation paths")
        
        return suggestions
    
    def add_feedback_hook(self, hook_function):
        """Add a feedback hook function."""
        self.feedback_hooks.append(hook_function)
    
    def remove_feedback_hook(self, hook_function):
        """Remove a feedback hook function."""
        if hook_function in self.feedback_hooks:
            self.feedback_hooks.remove(hook_function)
