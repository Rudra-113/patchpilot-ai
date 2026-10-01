from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

Severity = Literal["critical", "high", "medium", "low"]
FindingStatus = Literal["unfixed", "fix_ready", "applied", "verified", "failed"]
StageStatus = Literal["pending", "running", "completed", "failed"]
ScanStatus = Literal["running", "completed", "failed"]
CheckStatus = Literal["passed", "failed", "pending"]
PresenceStatus = Literal["resolved", "still_present", "pending"]


class APIModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Analysis(APIModel):
    summary: str
    root_cause: str
    attack_vector: str
    security_impact: str
    recommended_remediation: str
    source: Literal["demo", "model"]


class FixProposal(APIModel):
    summary: str
    explanation: str
    before: str
    after: str
    file: str
    source: Literal["demo", "model"]


class TestResult(APIModel):
    command: str
    passed: int
    failed: int
    status: Literal["passed", "failed"]
    demo_mode: bool
    note: str


class VerificationChecks(APIModel):
    security_scan: CheckStatus
    tests: CheckStatus
    original_vulnerability: PresenceStatus
    regression: CheckStatus


class Verification(APIModel):
    verified: bool
    checks: VerificationChecks
    summary: str
    before: str
    after: str
    demo_mode: bool


class Finding(APIModel):
    id: str
    severity: Severity
    title: str
    scanner: str
    file: str
    line: int
    status: FindingStatus
    description: str
    why_it_matters: str
    cwe: str
    code: str
    analysis: Analysis | None = None
    fix: FixProposal | None = None
    test_result: TestResult | None = None
    verification: Verification | None = None
    verified_at: str | None = None


class Stage(APIModel):
    id: str
    label: str
    status: StageStatus


class LogLine(APIModel):
    id: str
    time: str
    message: str
    level: Literal["info", "good", "warn", "bad", "ai"]


class ActivityEvent(APIModel):
    id: str
    time: str
    title: str
    detail: str


class Scan(APIModel):
    id: str
    repository: str
    branch: str
    status: ScanStatus
    demo_mode: bool
    created_at: str
    note: str
    stages: list[Stage]
    logs: list[LogLine]
    findings: list[Finding]
    activity: list[ActivityEvent]
    security_score: int = 0
    findings_count: int = 0
    fixed_count: int = 0

    def refresh_counts(self) -> None:
        from app.services.scoring import security_score

        self.security_score = security_score(self.findings)
        self.findings_count = len(self.findings)
        self.fixed_count = sum(1 for finding in self.findings if finding.status == "verified")


class ScanSummary(APIModel):
    id: str
    repository: str
    branch: str
    created_at: str
    findings: int
    fixed: int
    security_score: int
    status: str
    demo_mode: bool


class ScanRequest(APIModel):
    url: str
    branch: str = "main"


class ScannerStatus(APIModel):
    name: str
    available: bool


class HealthStatus(APIModel):
    status: str
    service: str
    demo_mode: bool


class SettingsStatus(APIModel):
    demo_mode: bool
    ai_provider: str
    ai_configured: bool
    ai_model: str
    github_configured: bool
    docker_available: bool
    docker_mode: str
    scanners: list[ScannerStatus]
