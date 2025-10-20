"""
Optimized L2 Diagnostic System - Faster with fewer GPT calls
Combines multiple analysis steps to reduce API call overhead
"""

import os
from typing import Dict

from .config import (
    LOG_DIR,
    KB_PATH,
    CASE_LOG_PATH,
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_VERSION,
    DEPLOYMENT_NAME,
)
from .log_searcher import LogSearcher
from .kb_searcher import KnowledgeBaseSearcher
from .case_log_searcher import CaseLogSearcher
from .gpt_analyzer_optimized import GPTAnalyzerOptimized


class L2DiagnosticSystemOptimized:
    """
    Optimized diagnostic system with reduced GPT calls.
    """

    def __init__(self):
        """Initialize all components."""
        self.base_dir = os.path.dirname(os.path.abspath(__file__))

        print("🚀 Initializing Optimized L2 Diagnostic System...")

        # Log searcher
        log_dir_path = os.path.join(self.base_dir, LOG_DIR)
        self.log_searcher = LogSearcher(log_dir_path)
        print(f"   ✓ Log searcher initialized ({len(self.log_searcher.log_files)} log files)")

        # Knowledge Base searcher
        kb_path = os.path.join(self.base_dir, KB_PATH)
        self.kb_searcher = KnowledgeBaseSearcher(kb_path)
        print(f"   ✓ Knowledge Base loaded ({len(self.kb_searcher.articles)} articles)")

        # Case Log searcher
        case_log_path = os.path.join(self.base_dir, CASE_LOG_PATH)
        self.case_log_searcher = CaseLogSearcher(case_log_path)
        print(f"   ✓ Case Log loaded ({len(self.case_log_searcher.cases)} historical cases)")

        # Optimized GPT Analyzer
        self.gpt_analyzer = GPTAnalyzerOptimized(
            api_key=AZURE_OPENAI_API_KEY,
            endpoint=AZURE_OPENAI_ENDPOINT,
            api_version=AZURE_OPENAI_API_VERSION,
            deployment=DEPLOYMENT_NAME,
        )
        print("   ✓ Azure OpenAI connected (Optimized)\n")

    def diagnose(self, alert_text: str, verbose: bool = False) -> Dict:
        """
        Optimized diagnostic pipeline - Faster with fewer GPT calls.
        
        Optimization: Reduced from 5-7 GPT calls to just 2 GPT calls
        - Call 1: Parse + Root Cause Analysis (combined)
        - Call 2: Resolution + Escalation Decision (combined)
        
        Args:
            alert_text: The raw alert text (email/SMS/call)
            verbose: Print progress messages
            
        Returns:
            Dict containing all diagnostic information
        """
        if verbose:
            print("=" * 80)
            print("🔍 STARTING OPTIMIZED DIAGNOSTIC ANALYSIS")
            print("=" * 80)

        # OPTIMIZATION: Search Case Log and KB first (no GPT needed)
        if verbose:
            print("\n📚 Step 1: Quick search for similar cases and KB articles...")
        
        # Quick parse to get basic info without GPT
        quick_parse = self._quick_parse(alert_text)
        
        # Search similar cases
        similar_cases = []
        if quick_parse.get("entity_id") or quick_parse.get("error_pattern"):
            keywords = []
            if quick_parse.get("entity_id"):
                keywords.append(quick_parse["entity_id"])
            if quick_parse.get("error_pattern"):
                keywords.append(quick_parse["error_pattern"])
            similar_cases = self.case_log_searcher.search_by_keywords(keywords)[:3]
        
        # Search KB articles
        kb_articles = []
        if quick_parse.get("module"):
            module_mapping = {"Vessel": "VSL", "Container": "CNTR", "EDI/API": "EDI/API", "API": "EDI/API"}
            kb_module = module_mapping.get(quick_parse.get("module"), quick_parse.get("module"))
            kb_articles = self.kb_searcher.search_by_module(kb_module)[:3]
        
        # Search logs
        log_evidence = []
        if quick_parse.get("entity_id"):
            log_evidence = self.log_searcher.search_all_logs(quick_parse["entity_id"])[:5]
        
        if verbose:
            print(f"   ✓ Found {len(similar_cases)} similar cases")
            print(f"   ✓ Found {len(kb_articles)} KB articles")
            print(f"   ✓ Found {len(log_evidence)} log entries")

        # GPT CALL #1: Combined Parse + Root Cause Analysis
        if verbose:
            print("\n🤖 Step 2: GPT Analysis (Parse + Root Cause)...")
        
        analysis_result = self.gpt_analyzer.analyze_alert_and_root_cause(
            alert_text=alert_text,
            log_evidence=self.log_searcher.format_evidence(log_evidence),
            case_context=self.case_log_searcher.format_cases(similar_cases),
            kb_context=self.kb_searcher.format_articles(kb_articles),
        )
        
        parsed = analysis_result["parsed"]
        root_cause = analysis_result["root_cause"]
        
        if verbose:
            print(f"   ✓ Ticket: {parsed.get('ticket_id')} | Module: {parsed.get('module')}")
            print(f"   ✓ Root Cause: {root_cause.get('root_cause')}")
            print(f"   ✓ Confidence: {root_cause.get('confidence')}%")

        # Quick confidence assessment (no GPT needed)
        confidence_assessment = self.gpt_analyzer.calculate_confidence_fast(
            log_evidence=log_evidence,
            similar_cases=similar_cases,
            kb_articles=kb_articles,
            parsed=parsed,
            root_cause_confidence=root_cause.get("confidence", 50)
        )
        
        if verbose:
            print(f"\n📊 Step 3: Confidence Assessment: {confidence_assessment['overall_score']}%")

        # GPT CALL #2: Combined Resolution + Escalation + Report
        if verbose:
            print("\n💡 Step 4: GPT Resolution (Resolution + Escalation + Report)...")
        
        case_solutions = ""
        if similar_cases:
            case_solutions = "\n\n".join([f"Past solution: {case.get('solution', '')}" for case in similar_cases[:2]])
        
        resolution_result = self.gpt_analyzer.generate_resolution_and_decision(
            parsed=parsed,
            root_cause=root_cause,
            confidence_score=confidence_assessment['overall_score'],
            kb_context=self.kb_searcher.format_articles(kb_articles),
            case_solutions=case_solutions,
            alert_text=alert_text,
            log_evidence=self.log_searcher.format_evidence(log_evidence),
        )
        
        resolution = resolution_result["resolution"]
        report = resolution_result["report"]
        
        if verbose:
            print(f"   ✓ Resolution steps: {len(resolution.get('resolution_steps', []))}")
            print(f"   ✓ Escalate: {resolution.get('escalate', False)}")
            print(f"   ✓ Estimated time: {resolution.get('estimated_time', 'Unknown')}")

        if verbose:
            print("\n" + "=" * 80)
            print("✅ OPTIMIZED DIAGNOSIS COMPLETE (2 GPT calls)")
            print("=" * 80)

        # Quick impact and severity assessment (no GPT)
        impact_score = self._calculate_quick_impact(parsed, confidence_assessment['overall_score'])
        severity = self._determine_quick_severity(parsed, impact_score, confidence_assessment['overall_score'])
        
        return {
            "parsed": parsed,
            "similar_cases": similar_cases,
            "log_evidence": log_evidence,
            "kb_articles": kb_articles,
            "root_cause": root_cause,
            "resolution": resolution,
            "report": report,
            "confidence_assessment": confidence_assessment,
            "impact_assessment": {"impact_score": impact_score, "factors": {}},
            "severity_classification": {"severity": severity},
            "justification": {"summary": resolution.get("escalate_reason", "")},
            "structured_metadata": {},
            "learning_feedback_id": parsed.get("ticket_id", "unknown"),
        }
    
    def _quick_parse(self, alert_text: str) -> Dict:
        """Quick regex-based parse to get basic info without GPT."""
        import re
        
        result = {}
        
        # Try to find ticket ID
        ticket_patterns = [
            r'(ALR-\d+)', r'(INC-\d+)', r'(CALL-\d+)',
            r'(IFT-\d+)', r'(REQ-\d+)'
        ]
        for pattern in ticket_patterns:
            match = re.search(pattern, alert_text, re.IGNORECASE)
            if match:
                result["ticket_id"] = match.group(1)
                break
        
        # Try to find entity ID
        entity_patterns = [r'([A-Z]{4}\d{7})', r'([A-Z]+ [A-Z]+ \d+)']
        for pattern in entity_patterns:
            match = re.search(pattern, alert_text)
            if match:
                result["entity_id"] = match.group(1)
                break
        
        # Try to detect module
        if re.search(r'container', alert_text, re.IGNORECASE):
            result["module"] = "Container"
        elif re.search(r'vessel', alert_text, re.IGNORECASE):
            result["module"] = "Vessel"
        elif re.search(r'EDI|API|message', alert_text, re.IGNORECASE):
            result["module"] = "EDI/API"
        
        # Try to find error pattern
        if re.search(r'error|ERROR|fail|duplicate|stuck', alert_text, re.IGNORECASE):
            result["error_pattern"] = "error"
        
        return result
    
    def _calculate_quick_impact(self, parsed: Dict, confidence: int) -> int:
        """Quick impact calculation without GPT."""
        priority = parsed.get("priority", "Medium")
        
        if priority == "High":
            base_impact = 80
        elif priority == "Medium":
            base_impact = 50
        else:
            base_impact = 30
        
        # Adjust based on confidence
        if confidence < 50:
            base_impact = min(100, base_impact + 20)
        
        return base_impact
    
    def _determine_quick_severity(self, parsed: Dict, impact: int, confidence: int) -> str:
        """Quick severity determination without GPT."""
        priority = parsed.get("priority", "Medium")
        
        if priority == "High" and impact >= 70:
            return "High"
        elif impact >= 70 or (priority == "High" and confidence < 50):
            return "High"
        elif impact >= 50 or priority == "Medium":
            return "Medium"
        else:
            return "Low"

