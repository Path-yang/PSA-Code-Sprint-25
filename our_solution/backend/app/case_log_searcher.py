"""
Case Log Excel parser and search functionality
"""

import zipfile
import xml.etree.ElementTree as ET
from typing import List, Dict


class CaseLogSearcher:
    """Parse and search historical case log"""

    def __init__(self, case_log_path: str):
        self.case_log_path = case_log_path
        self.cases = self._parse_excel()

    def _parse_excel(self) -> List[Dict]:
        """Parse Excel file to extract cases"""
        cases = []

        try:
            with zipfile.ZipFile(self.case_log_path, 'r') as zip_ref:
                # Read shared strings
                shared_strings_xml = zip_ref.read('xl/sharedStrings.xml')
                root = ET.fromstring(shared_strings_xml)
                strings = []
                for si in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                    if si.text:
                        strings.append(si.text)

                # Map strings to cases
                # Based on our earlier exploration, we know the structure:
                # strings[0-7] are headers
                # Then groups of data for each case
                # Pattern: Module, Mode, EDI, Timestamp, Alert, Problem, Solution, SOP

                i = 8  # Start after headers
                while i < len(strings):
                    try:
                        module_value = strings[i] if i < len(strings) else ''
                        # Replace "EDI" with "EDI/API" for consistency
                        if module_value.upper() == 'EDI':
                            module_value = 'EDI/API'
                        
                        case = {
                            'module': module_value,
                            'mode': strings[i+1] if i+1 < len(strings) else '',
                            'edi': strings[i+2] if i+2 < len(strings) else '',
                            'timestamp': strings[i+3] if i+3 < len(strings) else '',
                            'alert': strings[i+4] if i+4 < len(strings) else '',
                            'problem': strings[i+5] if i+5 < len(strings) else '',
                            'solution': strings[i+6] if i+6 < len(strings) else '',
                            'sop': strings[i+7] if i+7 < len(strings) else ''
                        }

                        # Only add if it has meaningful content
                        if case['problem'] or case['alert']:
                            cases.append(case)

                        i += 8  # Move to next case
                    except IndexError:
                        break

        except Exception as e:
            print(f"Error parsing case log: {e}")

        return cases

    def search_by_keywords(self, keywords: List[str]) -> List[Dict]:
        """Search cases by keywords in problem/alert text"""
        matching_cases = []

        for case in self.cases:
            searchable_text = (
                case.get('alert', '') + ' ' +
                case.get('problem', '') + ' ' +
                case.get('solution', '')
            ).lower()

            keyword_matches = sum(1 for keyword in keywords if keyword.lower() in searchable_text)

            if keyword_matches > 0:
                matching_cases.append({
                    **case,
                    'relevance_score': keyword_matches / len(keywords),
                    'match_count': keyword_matches
                })

        # Sort by relevance
        matching_cases.sort(key=lambda x: x['relevance_score'], reverse=True)
        return matching_cases

    def search_by_module(self, module: str) -> List[Dict]:
        """Get cases for a specific module"""
        module_map = {
            'container': 'Container',
            'vessel': 'Vessel',
            'edi': 'EDI/API',
            'api': 'EDI/API'
        }

        target_module = module_map.get(module.lower(), module)
        return [case for case in self.cases if target_module.lower() in case.get('module', '').lower()]

    def search_by_mode(self, mode: str) -> List[Dict]:
        """Get cases by alert mode (Email, SMS, Call)"""
        return [case for case in self.cases if mode.lower() in case.get('mode', '').lower()]

    def find_similar_cases(self, symptoms: List[str], module: str = None) -> List[Dict]:
        """
        Find similar past cases based on symptoms

        Args:
            symptoms: List of symptom keywords
            module: Optional module filter

        Returns:
            List of similar cases sorted by relevance
        """
        similar = self.search_by_keywords(symptoms)

        if module:
            similar = [case for case in similar if module.lower() in case.get('module', '').lower()]

        return similar

    def format_cases(self, cases: List[Dict], max_cases: int = 3) -> str:
        """Format cases as readable text"""
        if not cases:
            return "No similar past cases found."

        output = []
        for i, case in enumerate(cases[:max_cases]):
            output.append(f"=== Similar Case {i+1} (Relevance: {case.get('relevance_score', 0):.0%}) ===")
            output.append(f"Module: {case.get('module', 'Unknown')}")
            output.append(f"Mode: {case.get('mode', 'Unknown')}")
            output.append(f"Problem: {case.get('problem', '')[:200]}...")
            output.append(f"Solution: {case.get('solution', '')[:200]}...")
            output.append(f"SOP Reference: {case.get('sop', 'None')}")
            output.append("")

        return "\n".join(output)

    def get_all_cases(self) -> List[Dict]:
        """Get all cases"""
        return self.cases
