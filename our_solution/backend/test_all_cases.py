"""
Test script for the four supplied hackathon cases.
"""

import json

from app.diagnostic_system import L2DiagnosticSystem


# Test case definitions
TEST_CASES = {
    "test_case_1": """
RE: Email ALR-861600 | CMAU0000020 - Duplicate Container information received

To: Ops Team Duty; Jen
Cc: Customer Service

Hi Jen,

Please assist in checking container CMAU0000020. Customer on PORTNET is seeing 2
identical containers information.

Thanks.

Regards,
Kenny
""",

    "test_case_2": """
RE: Email ALR-861631 | VESSEL_ERR_4 - System Vessel Name has been used by other vessel advice

To: Ops Team Duty; Vedu
Cc: Customer Service

Hi Vedu,

Customer reported that they were unable to create vessel advice for MV Lion City 07 and
hit error VESSEL_ERR_4. The local vessel name had been used by other vessel advice.

Please assist, thanks.

Regards,
Jia Xuan
""",

    "test_case_3": """
Alert: SMS INC-154599

Issue: EDI message REF-IFT-0007 stuck in ERROR status (Sender: LINE-PSA,
Recipient: PSA-TOS, State: No acknowledgment sent, ack_at is NULL).
""",

    "test_case_4": """
Alert: Call TCK-742311

Issues: Vessel MV PACIFIC DAWN/07E exception at Pasir Panjang Terminal 4

Details: BAPLIE inconsistency for MV PACIFIC DAWN/07E: COARRI shows load completed for bay
14, but BAPLIE still lists units in those slots. Older timestamp regressed the plan. All numeric
identifiers are randomized placeholders; no credentials stored. Please investigate and resolve
urgently. Contact the relevant team if needed.
""",
}


def test_single_case(system: L2DiagnosticSystem, case_name: str, alert_text: str):
    """Test a single case and save results."""
    print("\n" + "=" * 100)
    print(f"TESTING: {case_name.upper().replace('_', ' ')}")
    print("=" * 100)

    result = system.diagnose(alert_text, verbose=True)

    print("\n" + "=" * 100)
    print("DIAGNOSTIC REPORT")
    print("=" * 100 + "\n")
    print(result["report"])

    output_file = f"{case_name}_report.md"
    with open(output_file, "w", encoding="utf-8") as handle:
        handle.write(f"# {case_name.upper().replace('_', ' ')}\n\n")
        handle.write(f"## Original Alert\n\n```\n{alert_text}\n```\n\n")
        handle.write(f"## Diagnostic Report\n\n{result['report']}\n\n")
        handle.write("## Technical Details\n\n")
        handle.write(
            "### Parsed Information\n```json\n"
            f"{json.dumps(result['parsed'], indent=2)}\n```\n\n"
        )
        handle.write(
            "### Root Cause Analysis\n```json\n"
            f"{json.dumps(result['root_cause'], indent=2)}\n```\n\n"
        )
        handle.write(
            "### Resolution\n```json\n"
            f"{json.dumps(result['resolution'], indent=2)}\n```\n\n"
        )

    print(f"\n✅ Report saved to: {output_file}")

    return result


def main():
    """Run all test cases."""
    print("=" * 100)
    print("L2 DIAGNOSTIC SYSTEM - TESTING ALL 4 TEST CASES")
    print("=" * 100)

    system = L2DiagnosticSystem()
    results = {}

    for case_name, alert_text in TEST_CASES.items():
        result = test_single_case(system, case_name, alert_text)
        results[case_name] = result

        print("\n" + "-" * 100)
        input("Press Enter to continue to next test case...")

    print("\n" + "=" * 100)
    print("SUMMARY OF ALL TEST CASES")
    print("=" * 100)

    for case_name, result in results.items():
        print(f"\n{case_name.upper().replace('_', ' ')}:")
        print(f"  Ticket ID: {result['parsed'].get('ticket_id')}")
        print(f"  Module: {result['parsed'].get('module')}")
        print(f"  Confidence: {result['root_cause'].get('confidence')}%")
        print(f"  Escalate: {result['resolution'].get('escalate')}")
        print(f"  Estimated Time: {result['resolution'].get('estimated_time')}")

    print("\n" + "=" * 100)
    print("✅ ALL TESTS COMPLETE")
    print("=" * 100)


if __name__ == "__main__":
    main()
