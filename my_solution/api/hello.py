from typing import Any, Dict


def handler(request: Any) -> Dict[str, Any]:
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": "{\"message\": \"hello from python\"}"
    }
