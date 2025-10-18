# L2 Product Operations Diagnostic System

An AI-powered diagnostic system for Level 2 Product Operations support using Azure OpenAI.

## Overview

This system automatically diagnoses support tickets by:
1. Parsing alerts using GPT
2. Searching historical Case Log for similar issues
3. Analyzing application logs for evidence
4. Querying relevant Knowledge Base articles
5. Performing root cause analysis with GPT
6. Recommending proven resolution steps
7. Generating professional diagnostic reports

## Features

- **Multi-channel Support**: Handles Email, SMS, and Call alerts
- **Intelligent Case Matching**: Finds similar past cases using semantic search
- **Evidence-Based Diagnosis**: Combines logs, database, KB, and historical cases
- **GPT-Powered Analysis**: Uses Azure OpenAI for intelligent reasoning
- **Automated Reporting**: Generates professional markdown reports
- **Escalation Guidance**: Knows when and who to escalate to

## Project Structure

```
my_solution/
├── config.py                  # Configuration (API keys, paths)
├── diagnostic_system.py       # Main orchestrator
├── gpt_analyzer.py           # Azure OpenAI integration
├── log_searcher.py           # Application log search
├── kb_searcher.py            # Knowledge Base search
├── case_log_searcher.py      # Case Log Excel parser
├── test_all_cases.py         # Test script for all 4 test cases
└── README.md                 # This file
```

## Setup

### Prerequisites

```bash
pip install openai
```

Note: No additional libraries needed for Excel parsing - uses built-in zipfile and xml libraries.

### Configuration

The API keys and paths are already configured in `config.py`. The system expects the following directory structure:

```
PSA'25/
├── my_solution/              # Your solution files
└── Problem Statement 3.../   # Provided data files
    ├── Application Logs/
    ├── Database/
    ├── Knowledge Base.txt
    └── Case Log.xlsx
```

## Usage

### Quick Start - Test All Cases

Run all 4 test cases:

```bash
cd my_solution
python test_all_cases.py
```

This will:
- Process all 4 test cases sequentially
- Print diagnostic reports to console
- Save detailed reports as markdown files

### Single Alert Diagnosis

```python
from diagnostic_system import L2DiagnosticSystem

# Initialize
system = L2DiagnosticSystem()

# Diagnose an alert
alert = """
Your alert text here...
"""

result = system.diagnose(alert)

# Print report
system.print_report(result)
```

### Result Structure

The `diagnose()` method returns:

```python
{
    'parsed': {
        'ticket_id': '...',
        'module': '...',
        'entity_id': '...',
        # ... more parsed fields
    },
    'similar_cases': [
        # Top 3 similar historical cases
    ],
    'log_evidence': [
        # Relevant log entries
    ],
    'kb_articles': [
        # Relevant KB articles
    ],
    'root_cause': {
        'root_cause': '...',
        'confidence': 95,
        # ... more analysis
    },
    'resolution': {
        'resolution_steps': [...],
        'escalate': True/False,
        # ... more recommendations
    },
    'report': '...'  # Full markdown report
}
```

## Test Cases

The system is tested against 4 scenarios:

1. **Test Case 1**: Email - Duplicate Container (CMAU0000020)
2. **Test Case 2**: Email - Vessel Advice Error (VESSEL_ERR_4)
3. **Test Case 3**: SMS - EDI Message Stuck (REF-IFT-0007)
4. **Test Case 4**: Call - BAPLIE Inconsistency (MV PACIFIC DAWN)

## How It Works

### Diagnostic Pipeline

```
Alert Input
    ↓
[1] GPT parses alert → Extract ticket ID, module, entity, symptoms
    ↓
[2] Search Case Log → Find similar past cases (guides investigation)
    ↓
[3] Search Logs → Find evidence in application logs
    ↓
[4] Search KB → Get relevant procedures
    ↓
[5] GPT analyzes → Root cause with confidence score
    ↓
[6] GPT recommends → Resolution steps from KB + past cases
    ↓
[7] GPT generates → Professional diagnostic report
    ↓
Output: Complete diagnosis with actionable steps
```

### Key Design Decisions

1. **Case Log First**: Searches historical cases early to guide targeted investigation
2. **Evidence-Based**: Combines multiple data sources for high-confidence diagnosis
3. **GPT for Intelligence**: Uses AI for parsing, analysis, and report generation
4. **Simple for Scale**: Log files are small, so simple search is sufficient

## Components

### LogSearcher
- Searches 6 application log files
- Supports entity ID search, error level filtering
- Formats evidence for GPT analysis

### KnowledgeBaseSearcher
- Parses Knowledge Base into articles
- Keyword and module-based search
- Provides context for resolution recommendations

### CaseLogSearcher
- Parses Excel file (without external libraries)
- Finds similar cases by symptoms
- Extracts proven solutions from history

### GPTAnalyzer
- Azure OpenAI integration
- Alert parsing with structured output
- Root cause analysis from evidence
- Resolution recommendation
- Professional report generation

### DiagnosticSystem
- Orchestrates all components
- Implements the diagnostic pipeline
- Manages workflow and error handling

## Performance

- **Alert Parsing**: ~2 seconds
- **Case Log Search**: <1 second (40 cases)
- **Log Search**: <1 second (6 small files)
- **GPT Analysis**: 3-5 seconds per call
- **Total Time**: ~15-20 seconds per diagnosis

## Output Examples

Each test generates:
- Console output with progress
- Markdown report file (`test_case_N_report.md`)
- Includes parsed data, analysis, and recommendations

## Troubleshooting

### Azure OpenAI Connection Issues
- Verify API key in `config.py`
- Check endpoint URL format
- Ensure deployment name matches your Azure setup

### File Not Found Errors
- Verify directory structure matches expected layout
- Check paths in `config.py`
- Ensure all data files are present

### Excel Parsing Issues
- The Case Log parser uses built-in libraries
- If parsing fails, check Excel file format

## Future Enhancements

- Database integration for live queries
- Embeddings for better case matching
- Real-time log streaming
- Web UI for ticket submission
- Automated escalation workflows

## License

Created for PSA Code Sprint 2025
