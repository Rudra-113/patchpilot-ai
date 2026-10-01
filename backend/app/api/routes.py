from fastapi import APIRouter, File, UploadFile

from app.core.config import ai_configured, ai_model, ai_provider, demo_mode, github_token
from app.core.errors import APIError
from app.core.store import store
from app.schemas.api import Finding, HealthStatus, Scan, ScanRequest, ScanSummary, ScannerStatus, SettingsStatus, TestResult, Verification
from app.scanners.registry import scanner_status
from app.services.engine import apply_fix, generate_fix, run_tests, start_github_scan, start_upload_scan, verify_fix
from app.services.sandbox import sandbox

router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthStatus)
def health() -> HealthStatus:
    return HealthStatus(status="ok", service="patchpilot", demo_mode=demo_mode())


@router.get("/settings", response_model=SettingsStatus)
def settings() -> SettingsStatus:
    provider = ai_provider()
    return SettingsStatus(
        demo_mode=demo_mode(),
        ai_provider=provider if provider != "none" else "not_configured",
        ai_configured=ai_configured(),
        ai_model=ai_model() or ("demo" if demo_mode() else ""),
        github_configured=bool(github_token()),
        docker_available=sandbox.docker_available(),
        docker_mode=sandbox.mode_label(),
        scanners=[ScannerStatus(name=name, available=available) for name, available in scanner_status()],
    )


@router.get("/scans", response_model=list[ScanSummary])
def list_scans() -> list[ScanSummary]:
    return [
        ScanSummary(
            id=scan.id,
            repository=scan.repository,
            branch=scan.branch,
            created_at=scan.created_at,
            findings=scan.findings_count,
            fixed=scan.fixed_count,
            security_score=scan.security_score,
            status=scan.status,
            demo_mode=scan.demo_mode,
        )
        for scan in store.summaries()
    ]


@router.post("/scan", response_model=Scan)
def create_scan(body: ScanRequest) -> Scan:
    return start_github_scan(body.url, body.branch)


@router.post("/repositories/upload", response_model=Scan)
async def upload_repository(file: UploadFile = File(...)) -> Scan:
    payload = await file.read()
    return start_upload_scan(file.filename or "repository.zip", payload)


@router.get("/scans/{scan_id}", response_model=Scan)
def get_scan(scan_id: str) -> Scan:
    scan = store.snapshot(scan_id)
    if scan is None:
        raise APIError(404, "Scan not found.", "Start a scan before requesting this id.")
    return scan


@router.get("/scans/{scan_id}/findings", response_model=list[Finding])
def get_findings(scan_id: str) -> list[Finding]:
    scan = store.snapshot(scan_id)
    if scan is None:
        raise APIError(404, "Scan not found.", "Start a scan before requesting findings.")
    return scan.findings


@router.get("/findings/{finding_id}", response_model=Finding)
def get_finding(finding_id: str) -> Finding:
    try:
        _, finding = store.find(finding_id)
    except KeyError as exc:
        raise APIError(404, "Finding not found.", "That finding is not in an active scan.") from exc
    return finding


@router.post("/findings/{finding_id}/generate-fix", response_model=Finding)
def post_generate_fix(finding_id: str) -> Finding:
    return generate_fix(finding_id)


@router.post("/findings/{finding_id}/apply-fix", response_model=Finding)
def post_apply_fix(finding_id: str) -> Finding:
    return apply_fix(finding_id)


@router.post("/findings/{finding_id}/test", response_model=TestResult)
def post_test(finding_id: str) -> TestResult:
    return run_tests(finding_id)


@router.post("/findings/{finding_id}/verify", response_model=Verification)
def post_verify(finding_id: str) -> Verification:
    return verify_fix(finding_id)


@router.get("/activity/{scan_id}")
def get_activity(scan_id: str):
    scan = store.snapshot(scan_id)
    if scan is None:
        raise APIError(404, "Scan not found.", "Start a scan before requesting activity.")
    return scan.activity
