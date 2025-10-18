"""
Log file search functionality
"""

import os
from typing import List, Dict


class LogSearcher:
    """Search application log files for evidence"""

    def __init__(self, log_dir: str):
        self.log_dir = log_dir
        self.log_files = [
            "container_service.log",
            "vessel_advice_service.log",
            "edi_adivce_service.log",
            "vessel_registry_service.log",
            "berth_application_service.log",
            "api_event_service.log"
        ]

    def search_all_logs(self, search_term: str) -> List[Dict]:
        """
        Search all log files for a term

        Args:
            search_term: The term to search for (e.g., container number, error code)

        Returns:
            List of dicts with file, line number, and content
        """
        results = []

        for log_file in self.log_files:
            log_path = os.path.join(self.log_dir, log_file)
            try:
                with open(log_path, 'r') as f:
                    for line_num, line in enumerate(f, 1):
                        if search_term.upper() in line.upper():
                            results.append({
                                'file': log_file,
                                'line': line_num,
                                'content': line.strip()
                            })
            except FileNotFoundError:
                continue

        return results

    def search_specific_log(self, log_file: str, search_term: str) -> List[Dict]:
        """Search a specific log file"""
        results = []
        log_path = os.path.join(self.log_dir, log_file)

        try:
            with open(log_path, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    if search_term.upper() in line.upper():
                        results.append({
                            'file': log_file,
                            'line': line_num,
                            'content': line.strip()
                        })
        except FileNotFoundError:
            pass

        return results

    def search_by_level(self, level: str = "ERROR") -> List[Dict]:
        """Search for log entries by level (ERROR, WARN, INFO, DEBUG)"""
        results = []

        for log_file in self.log_files:
            log_path = os.path.join(self.log_dir, log_file)
            try:
                with open(log_path, 'r') as f:
                    for line_num, line in enumerate(f, 1):
                        if f" {level} " in line or f" {level}  " in line:
                            results.append({
                                'file': log_file,
                                'line': line_num,
                                'level': level,
                                'content': line.strip()
                            })
            except FileNotFoundError:
                continue

        return results

    def format_evidence(self, results: List[Dict], max_results: int = 10) -> str:
        """Format log search results as a readable string"""
        if not results:
            return "No relevant log entries found."

        output = []
        for i, result in enumerate(results[:max_results]):
            output.append(f"[{result['file']}:{result['line']}] {result['content']}")

        if len(results) > max_results:
            output.append(f"... and {len(results) - max_results} more entries")

        return "\n".join(output)
