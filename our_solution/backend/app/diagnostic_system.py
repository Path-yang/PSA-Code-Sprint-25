"""
Main L2 Diagnostic System
Orchestrates all components to provide intelligent diagnosis.
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
from .gpt_analyzer import GPTAnalyzer


class L2DiagnosticSystem:
    """
    Main diagnostic system that orchestrates all components.
    """

    def __init__(self):
        """Initialize all components."""
        self.base_dir = os.path.dirname(os.path.abspath(__file__))

        print("🔧 Initializing L2 Diagnostic System...")

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

        # GPT Analyzer
        self.gpt_analyzer = GPTAnalyzer(
            api_key=AZURE_OPENAI_API_KEY,
            endpoint=AZURE_OPENAI_ENDPOINT,
            api_version=AZURE_OPENAI_API_VERSION,
            deployment=DEPLOYMENT_NAME,
        )
        print("   ✓ Azure OpenAI connected\n")

    def diagnose(self, alert_text: str, verbose: bool = True) -> Dict:
        """
        Complete diagnostic pipeline for an alert.

        Args:
            alert_text: The raw alert text (email/SMS/call)
            verbose: Print progress messages

        Returns:
            Dict containing all diagnostic information and markdown report
        """
        if verbose:
            print("=" * 80)
            print("🔍 STARTING DIAGNOSTIC ANALYSIS")
            print("=" * 80)

        # Step 1: Parse alert using GPT
        if verbose:
            print("\n📋 Step 1: Parsing alert with GPT...")
        parsed = self.gpt_analyzer.parse_alert(alert_text)
        if verbose:
            print(f"   ✓ Ticket ID: {parsed.get('ticket_id')}")
            print(f"   ✓ Module: {parsed.get('module')}")
            print(f"   ✓ Entity: {parsed.get('entity_id')}")
            print(f"   ✓ Channel: {parsed.get('channel')}")

        # Step 2: Search Case Log for similar cases (DO THIS EARLY!)
        if verbose:
            print("\n📚 Step 2: Searching Case Log for similar cases...")
        similar_cases = []
        
        # First try keyword search with symptoms
        if parsed.get("symptoms"):
            similar_cases = self.case_log_searcher.find_similar_cases(
                symptoms=parsed["symptoms"],
                module=parsed.get("module"),
            )
        
        # If no keyword matches, try error code search
        if not similar_cases and parsed.get("error_code"):
            error_cases = self.case_log_searcher.search_by_keywords([parsed["error_code"]])
            if parsed.get("module"):
                # Filter by module
                similar_cases = [case for case in error_cases if parsed["module"].lower() in case.get('module', '').lower()]
            else:
                similar_cases = error_cases
        
        # If still no matches, try module search as fallback
        if not similar_cases and parsed.get("module"):
            module_cases = self.case_log_searcher.search_by_module(parsed["module"])
            similar_cases = module_cases[:5]  # Limit to top 5 module cases
        
        if verbose:
            print(f"   ✓ Found {len(similar_cases)} similar past cases")
            if similar_cases:
                print(f"   ✓ Best match: {similar_cases[0].get('relevance_score', 0):.0%} relevance")
            print(f"   DEBUG: similar_cases has {len(similar_cases)} items")

        # Step 3: Search logs (targeted based on case hints if available)
        if verbose:
            print("\n📝 Step 3: Searching application logs...")
        log_evidence = []
        if parsed.get("entity_id"):
            log_evidence = self.log_searcher.search_all_logs(parsed["entity_id"])

        if parsed.get("error_code"):
            error_logs = self.log_searcher.search_all_logs(parsed["error_code"])
            log_evidence.extend(error_logs)

        if verbose:
            print(f"   ✓ Found {len(log_evidence)} log entries")

        # Step 4: Search Knowledge Base
        if verbose:
            print("\n📖 Step 4: Searching Knowledge Base...")
        kb_articles = []
        
        # First try keyword search
        if parsed.get("symptoms"):
            kb_articles = self.kb_searcher.search_by_keywords(parsed["symptoms"])
        
        # If no keyword matches, try error code search
        if not kb_articles and parsed.get("error_code"):
            kb_articles = self.kb_searcher.search_by_keywords([parsed["error_code"]])
        
        # If still no matches, try module search
        if not kb_articles and parsed.get("module"):
            # Map module names to KB module codes
            module_mapping = {
                "Vessel": "VSL",
                "Container": "CNTR", 
                "EDI": "EDI",
                "API": "API"
            }
            kb_module = module_mapping.get(parsed["module"], parsed["module"])
            kb_articles = self.kb_searcher.search_by_module(kb_module)

        if verbose:
            print(f"   ✓ Found {len(kb_articles)} relevant KB articles")
            if kb_articles:
                print(f"   DEBUG: First KB article has relevance_score: {kb_articles[0].get('relevance_score', 'NONE')}")

        # Step 5: Root cause analysis using GPT
        if verbose:
            print("\n🔬 Step 5: Analyzing root cause with GPT...")

        log_evidence_text = self.log_searcher.format_evidence(log_evidence)
        case_context = self.case_log_searcher.format_cases(similar_cases)
        kb_context = self.kb_searcher.format_articles(kb_articles)

        root_cause = self.gpt_analyzer.analyze_root_cause(
            alert=alert_text,
            parsed=parsed,
            log_evidence=log_evidence_text,
            case_context=case_context,
            kb_context=kb_context,
        )

        if verbose:
            print("   ✓ Root cause identified")
            print(f"   ✓ Confidence: {root_cause.get('confidence', 0)}%")

        # Step 6: Get resolution steps using GPT
        if verbose:
            print("\n💡 Step 6: Determining resolution steps...")

        case_solutions = ""
        if similar_cases:
            case_solutions = "\n\n".join(
                [f"Past solution: {case.get('solution', '')}" for case in similar_cases[:3]]
            )

        resolution = self.gpt_analyzer.get_resolution_steps(
            parsed=parsed,
            root_cause=root_cause,
            kb_context=kb_context,
            case_solutions=case_solutions,
        )

        if verbose:
            print("   ✓ Resolution determined")
            print(f"   ✓ Estimated time: {resolution.get('estimated_time', 'Unknown')}")
            if resolution.get("escalate"):
                print(f"   ⚠️  Escalation needed: {resolution.get('escalate_to')}")

        # Step 7: Generate polished report using GPT
        if verbose:
            print("\n📄 Step 7: Generating diagnostic report...")

        similar_cases_text = self.case_log_searcher.format_cases(similar_cases)

        report = self.gpt_analyzer.generate_report(
            alert=alert_text,
            parsed=parsed,
            log_evidence=log_evidence_text,
            similar_cases=similar_cases_text,
            root_cause=root_cause,
            resolution=resolution,
        )

        if verbose:
            print("   ✓ Report generated\n")

        # Step 8: Generate comprehensive confidence assessment
        if verbose:
            print("📊 Step 8: Generating confidence assessment...")

        if verbose:
            print(f"   DEBUG: Passing to confidence assessment:")
            print(f"     - log_evidence: {len(log_evidence)} items")
            print(f"     - similar_cases: {len(similar_cases)} items")
            print(f"     - kb_articles: {len(kb_articles)} items")
            if similar_cases:
                print(f"     - First case relevance: {similar_cases[0].get('relevance_score', 'NONE')}")
            if kb_articles:
                print(f"     - First KB relevance: {kb_articles[0].get('relevance_score', 'NONE')}")
        
        confidence_assessment = self.gpt_analyzer.generate_confidence_assessment(
            log_evidence=log_evidence,
            similar_cases=similar_cases,
            kb_articles=kb_articles,
            parsed=parsed,
            evidence_summary=root_cause.get("evidence_summary", [])
        )

        if verbose:
            print(f"   ✓ Overall confidence: {confidence_assessment['overall_score']}%")
            print(f"   ✓ Recommendation: {confidence_assessment['interpretation']['recommendation']}\n")
            print("=" * 80)
            print("✅ DIAGNOSIS COMPLETE")
            print("=" * 80)

        return {
            "parsed": parsed,
            "similar_cases": similar_cases[:3],
            "log_evidence": log_evidence,
            "kb_articles": kb_articles[:3],
            "root_cause": root_cause,
            "resolution": resolution,
            "report": report,
            "confidence_assessment": confidence_assessment,
        }

def print_report(self, result: Dict):
    """Print the diagnostic report."""
    print("\n" + "=" * 80)
    print("DIAGNOSTIC REPORT")
    print("=" * 80 + "\n")
    print(result["report"])


def main():
    """Demo/test function."""
    system = L2DiagnosticSystem()

    test_alert = """
RE: Email ALR-861600 | CMAU0000020 - Duplicate Container information received

To: Ops Team Duty; Jen
Cc: Customer Service

Hi Jen,

Please assist in checking container CMAU0000020. Customer on PORTNET is seeing 2
identical containers information.

Thanks.

Regards,
Kenny
"""

    result = system.diagnose(test_alert)
    system.print_report(result)


if __name__ == "__main__":
    main()
