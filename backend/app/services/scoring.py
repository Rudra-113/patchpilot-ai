from app.schemas.api import Finding

SEVERITY_WEIGHTS = {
    "critical": 7,
    "high": 3,
    "medium": 1,
    "low": 1,
}


def security_score(findings: list[Finding]) -> int:
    penalty = sum(SEVERITY_WEIGHTS[finding.severity] for finding in findings if finding.status != "verified")
    return max(0, min(100, 100 - penalty))
