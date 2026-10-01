import re
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.core.config import demo_delay, demo_mode
from app.core.errors import APIError
from app.core.store import store
from app.ai.service import ai_service
from app.scanners.base import RawFinding
from app.scanners.registry import run_scanners
from app.schemas.api import ActivityEvent, Finding, LogLine, Scan, Stage, TestResult
from app.services.demo_data import demo_findings
from app.services.ingest import clone_repository, extract_zip, repository_name, validate_branch, validate_github_url
from app.services.patching import apply_replacement
from app.services.sandbox import sandbox
from app.services.verification import build_verification, matches, regression_ok

STAGE_DEFS = [
    ("repository", "Repository"),
    ("ingestion", "Repository Ingestion"),
    ("scanners", "Security Scanners"),
    ("normalization", "Finding Normalization"),
    ("analysis", "AI Analysis"),
    ("fixes", "Fix Generation"),
    ("tests", "Tests"),
    ("verification", "Verification"),
]

DATA_ROOT = Path(__file__).resolve().parents[2] / "data"
SEED_ID = "scan-demo-001"


def _nid(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def _clock() -> str:
    return datetime.now().strftime("%H:%M:%S")


def _iso(moment: datetime | None = None) -> str:
    value = moment or datetime.now(timezone.utc)
    return value.isoformat()


def _stages(done_through: str | None = None, failed: str | None = None) -> list[Stage]:
    seen_done = done_through is None
    stages: list[Stage] = []
    for stage_id, label in STAGE_DEFS:
        if failed == stage_id:
            status = "failed"
        elif done_through is None:
            status = "pending"
        elif not seen_done:
            status = "completed"
        else:
            status = "pending"
        if stage_id == done_through:
            seen_done = True
            if failed != stage_id:
                status = "completed"
        stages.append(Stage(id=stage_id, label=label, status=status))
    return stages


def _log(scan: Scan, message: str, level: str = "info", time: str | None = None) -> None:
    scan.logs.append(LogLine(id=_nid("log"), time=time or _clock(), message=message, level=level))  # type: ignore[arg-type]


def _activity(scan: Scan, title: str, detail: str, time: str | None = None) -> None:
    scan.activity.append(ActivityEvent(id=_nid("act"), time=time or _clock(), title=title, detail=detail))


def _set_stage(scan: Scan, stage_id: str, status: str) -> None:
    for stage in scan.stages:
        if stage.id == stage_id:
            stage.status = status  # type: ignore[assignment]
            return


def blank_scan(*, repository: str, branch: str, demo: bool, note: str) -> Scan:
    return Scan(
        id=_nid("scan"),
        repository=repository,
        branch=branch,
        status="running",
        demo_mode=demo,
        created_at=_iso(),
        note=note,
        stages=_stages(),
        logs=[],
        findings=[],
        activity=[],
    )


def seed_demo_workspace() -> None:
    created = datetime.now(timezone.utc) - timedelta(minutes=2)
    scan = Scan(
        id=SEED_ID,
        repository="patchpilot-demo",
        branch="main",
        status="completed",
        demo_mode=True,
        created_at=_iso(created),
        note="Demo mode is on. These findings are deterministic fixtures, not a live scanner pass.",
        stages=_stages("analysis"),
        logs=[
            LogLine(id="log-seed-1", time="10:42:11", message="Repository loaded", level="info"),
            LogLine(id="log-seed-2", time="10:42:12", message="Inspecting project structure...", level="info"),
            LogLine(id="log-seed-3", time="10:42:13", message="Running Semgrep...", level="info"),
            LogLine(id="log-seed-4", time="10:42:14", message="Running Bandit...", level="info"),
            LogLine(id="log-seed-5", time="10:42:15", message="Running pip-audit...", level="info"),
            LogLine(id="log-seed-6", time="10:42:15", message="Running Gitleaks...", level="info"),
            LogLine(id="log-seed-7", time="10:42:15", message="Running Trivy...", level="info"),
            LogLine(id="log-seed-8", time="10:42:16", message="10 vulnerabilities detected", level="warn"),
            LogLine(id="log-seed-9", time="10:42:17", message="Normalizing findings...", level="info"),
            LogLine(id="log-seed-10", time="10:42:18", message="AI Security Agent analyzing findings...", level="ai"),
            LogLine(
                id="log-seed-11",
                time="10:42:18",
                message="Demo analysis attached. No model call was made.",
                level="ai",
            ),
            LogLine(
                id="log-seed-12",
                time="10:42:20",
                message="Fix generation, tests, and verification are still pending.",
                level="good",
            ),
        ],
        findings=demo_findings(SEED_ID, with_analysis=True),
        activity=[
            ActivityEvent(
                id="act-seed-1",
                time="10:42:11",
                title="Repository ingested",
                detail="patchpilot-demo · main · demo fixture",
            ),
            ActivityEvent(
                id="act-seed-2",
                time="10:42:14",
                title="Semgrep scan completed",
                detail="Demo fixture attributed to Semgrep",
            ),
            ActivityEvent(
                id="act-seed-3",
                time="10:42:16",
                title="10 findings detected",
                detail="Deterministic demo set, not a live scan",
            ),
            ActivityEvent(
                id="act-seed-4",
                time="10:42:18",
                title="AI analysis completed",
                detail="Bundled explanations. No model call.",
            ),
        ],
    )
    scan.refresh_counts()
    store.add(scan)


def start_github_scan(url: str, branch: str) -> Scan:
    cleaned = validate_github_url(url)
    selected = validate_branch(branch)
    if demo_mode():
        scan = blank_scan(
            repository="patchpilot-demo",
            branch="main",
            demo=True,
            note="Demo mode is on. The URL was recorded and was not fetched. Findings are deterministic fixtures.",
        )
        _log(scan, f"URL recorded: {cleaned}")
        store.add(scan)
        threading.Thread(target=_run_demo, args=(scan.id,), daemon=True).start()
        return store.snapshot(scan.id)  # type: ignore[return-value]
    name = repository_name(cleaned)
    scan = blank_scan(
        repository=name,
        branch=selected,
        demo=False,
        note="Live scan. Scanners that are not installed are skipped and do not produce findings.",
    )
    store.add(scan)
    threading.Thread(target=_run_real_clone, args=(scan.id, cleaned, selected), daemon=True).start()
    return store.snapshot(scan.id)  # type: ignore[return-value]


def start_upload_scan(filename: str, payload: bytes) -> Scan:
    if not filename.lower().endswith(".zip"):
        raise APIError(422, "Upload a ZIP archive.", "The file extension must be .zip.")
    if len(payload) > 20_000_000:
        raise APIError(422, "Upload a smaller archive.", "ZIP uploads are limited to 20 MB.")
    if demo_mode():
        scan = blank_scan(
            repository="patchpilot-demo",
            branch="main",
            demo=True,
            note="Demo mode is on. The ZIP was accepted and was not extracted or executed. Findings are deterministic fixtures.",
        )
        _log(scan, f"Upload recorded: {Path(filename).name}")
        store.add(scan)
        threading.Thread(target=_run_demo, args=(scan.id,), daemon=True).start()
        return store.snapshot(scan.id)  # type: ignore[return-value]
    scan = blank_scan(
        repository=Path(filename).stem or "upload",
        branch="upload",
        demo=False,
        note="Live scan of an uploaded archive. Repository code is not executed during scanning.",
    )
    workspace = DATA_ROOT / "workspaces" / scan.id
    workspace.mkdir(parents=True, exist_ok=True)
    archive_path = workspace / "upload.zip"
    archive_path.write_bytes(payload)
    store.add(scan, workspace)
    threading.Thread(target=_run_real_zip, args=(scan.id, archive_path, workspace / "tree"), daemon=True).start()
    return store.snapshot(scan.id)  # type: ignore[return-value]


def _pause() -> None:
    delay = demo_delay()
    if delay:
        threading.Event().wait(delay)


def _run_demo(scan_id: str) -> None:
    script: list[tuple[str, str, str, str]] = [
        ("repository", "running", "info", "Repository loaded"),
        ("repository", "completed", "info", "Demo workspace selected. GitHub was not contacted."),
        ("ingestion", "running", "info", "Inspecting project structure..."),
        ("ingestion", "completed", "good", "Demo tree ready"),
        ("scanners", "running", "warn", "Demo mode is not executing scanner binaries."),
        ("scanners", "running", "info", "Running Semgrep..."),
        ("scanners", "running", "info", "Running Bandit..."),
        ("scanners", "running", "info", "Running pip-audit..."),
        ("scanners", "running", "info", "Running Gitleaks..."),
        ("scanners", "running", "info", "Running Trivy..."),
        ("scanners", "completed", "warn", "10 vulnerabilities detected"),
        ("normalization", "running", "info", "Normalizing findings..."),
        ("normalization", "completed", "good", "Findings mapped to the common format"),
        ("analysis", "running", "ai", "AI Security Agent analyzing findings..."),
        ("analysis", "completed", "ai", "Demo analysis attached. No model call was made."),
    ]

    def apply(scan: Scan, stage_id: str, status: str, level: str, message: str) -> None:
        _set_stage(scan, stage_id, status)
        _log(scan, message, level)

    for stage_id, status, level, message in script:
        _pause()
        store.mutate(scan_id, lambda scan, stage_id=stage_id, status=status, level=level, message=message: apply(scan, stage_id, status, level, message))

    def finish(scan: Scan) -> None:
        scan.findings = demo_findings(scan.id, with_analysis=True)
        scan.status = "completed"
        _activity(scan, "Repository ingested", "patchpilot-demo · demo fixture")
        _activity(scan, "10 findings detected", "Deterministic demo set, not a live scan")
        _activity(scan, "AI analysis completed", "Bundled explanations. No model call.")
        _log(scan, "Fix generation, tests, and verification are still pending.", "good")

    store.mutate(scan_id, finish)


def _fail(scan_id: str, stage_id: str, message: str, detail: str) -> None:
    def apply(scan: Scan) -> None:
        _set_stage(scan, stage_id, "failed")
        scan.status = "failed"
        scan.note = detail or message
        _log(scan, message, "bad")
        _activity(scan, "Scan failed", detail or message)

    try:
        store.mutate(scan_id, apply)
    except KeyError:
        return


def _run_real_clone(scan_id: str, url: str, branch: str) -> None:
    workspace = DATA_ROOT / "workspaces" / scan_id / "tree"
    workspace.parent.mkdir(parents=True, exist_ok=True)
    try:
        store.mutate(scan_id, lambda scan: (_set_stage(scan, "repository", "running"), _log(scan, "Cloning repository")))
        _pause()
        clone_repository(url, branch, workspace)
        store.set_workspace(scan_id, workspace)
        _finish_real(scan_id, workspace)
    except APIError as exc:
        _fail(scan_id, "repository", exc.message, exc.detail)
    except Exception:
        _fail(scan_id, "repository", "Unable to clone the repository.", "Git could not read that URL and branch.")


def _run_real_zip(scan_id: str, archive: Path, workspace: Path) -> None:
    try:
        store.mutate(scan_id, lambda scan: (_set_stage(scan, "repository", "running"), _log(scan, "Archive received")))
        _pause()
        workspace.mkdir(parents=True, exist_ok=True)
        extract_zip(archive, workspace)
        store.set_workspace(scan_id, workspace)
        _finish_real(scan_id, workspace)
    except APIError as exc:
        _fail(scan_id, "repository", exc.message, exc.detail)
    except Exception:
        _fail(scan_id, "repository", "Unable to read the archive.", "The ZIP could not be extracted.")


def _finish_real(scan_id: str, workspace: Path) -> None:
    store.mutate(
        scan_id,
        lambda scan: (
            _set_stage(scan, "repository", "completed"),
            _set_stage(scan, "ingestion", "running"),
            _log(scan, "Inspecting project structure..."),
        ),
    )
    _pause()
    file_count = sum(1 for path in workspace.rglob("*") if path.is_file())
    store.mutate(
        scan_id,
        lambda scan: (
            _set_stage(scan, "ingestion", "completed"),
            _log(scan, f"Workspace contains {file_count} files", "good"),
            _set_stage(scan, "scanners", "running"),
        ),
    )
    results = run_scanners(workspace)
    raw: list[RawFinding] = []

    def record_tools(scan: Scan) -> None:
        for result in results:
            if not result.available:
                _log(scan, f"{result.name} is not installed. Skipped.", "warn")
                continue
            _log(scan, f"Running {result.name}...", "info")
            if result.error:
                _log(scan, f"{result.name} did not complete: {result.error}", "warn")
            else:
                _log(scan, f"{result.name} reported {len(result.findings)} findings", "good" if not result.findings else "warn")
            raw.extend(result.findings)
        _set_stage(scan, "scanners", "completed")
        _set_stage(scan, "normalization", "running")
        _log(scan, "Normalizing findings...", "info")

    store.mutate(scan_id, record_tools)
    _pause()
    findings = [_materialize(scan_id, index, item) for index, item in enumerate(raw, start=1)]
    if ai_service.configured():
        for finding in findings:
            try:
                finding.analysis = ai_service.analyze_finding(finding)
            except APIError:
                finding.analysis = None

    def finish(scan: Scan) -> None:
        scan.findings = findings
        _set_stage(scan, "normalization", "completed")
        _log(scan, f"{len(findings)} vulnerabilities detected", "warn" if findings else "good")
        _set_stage(scan, "analysis", "completed" if ai_service.configured() else "completed")
        if ai_service.configured():
            _log(scan, "AI Security Agent analyzing findings...", "ai")
        else:
            _log(scan, "AI service unavailable. Check configuration.", "warn")
        scan.status = "completed"
        _activity(scan, "Repository ingested", scan.repository)
        _activity(scan, f"{len(findings)} findings detected", "Normalized scanner output")

    store.mutate(scan_id, finish)


def _materialize(scan_id: str, index: int, raw: RawFinding) -> Finding:
    return Finding(
        id=f"{scan_id}-finding-{index:03d}",
        severity=raw.severity if raw.severity in {"critical", "high", "medium", "low"} else "medium",  # type: ignore[arg-type]
        title=raw.title or "Security finding",
        scanner=raw.scanner,
        file=raw.file or "unknown",
        line=max(1, raw.line),
        status="unfixed",
        description=raw.description,
        why_it_matters=raw.description,
        cwe=raw.cwe or "Unclassified",
        code=raw.code,
    )


def _load_finding(finding_id: str) -> tuple[Scan, Finding]:
    try:
        return store.find(finding_id)
    except KeyError as exc:
        raise APIError(404, "Finding not found.", "That finding is not in an active scan.") from exc


def generate_fix(finding_id: str) -> Finding:
    _, current = _load_finding(finding_id)
    if current.status in {"applied", "verified"}:
        raise APIError(409, "Unable to generate patch.", "This finding already has an applied patch.")
    fix = ai_service.generate_fix(current)

    def apply(scan: Scan, finding: Finding) -> None:
        finding.fix = fix
        finding.status = "fix_ready"
        finding.test_result = None
        finding.verification = None
        _set_stage(scan, "fixes", "completed")
        _log(scan, f"Remediation plan generated for {finding.title}", "ai")
        _activity(scan, "Patch generated", f"{finding.title} · {finding.file}:{finding.line}")

    _, updated = store.mutate_finding(finding_id, apply)
    return updated


def apply_fix(finding_id: str) -> Finding:
    _load_finding(finding_id)

    def apply(scan: Scan, finding: Finding) -> None:
        if finding.fix is None:
            raise APIError(409, "Unable to apply patch.", "Generate a fix before applying it.")
        if finding.status == "verified":
            raise APIError(409, "Unable to apply patch.", "This finding is already verified.")
        ai_service.review_patch(finding, finding.fix)
        if not scan.demo_mode:
            workspace = store.workspace_for(scan.id)
            if workspace is None:
                raise APIError(422, "Unable to apply patch.", "The scan workspace is no longer available.")
            apply_replacement(workspace, finding.fix)
        finding.status = "applied"
        finding.verification = None
        _log(scan, f"Patch applied to {finding.file}", "good")
        _activity(scan, "Patch applied", finding.file)

    _, finding = store.mutate_finding(finding_id, apply)
    return finding


def run_tests(finding_id: str) -> TestResult:
    scan, finding = _load_finding(finding_id)
    if finding.status not in {"applied", "verified", "failed"}:
        raise APIError(409, "Unable to run tests.", "Apply the patch before running tests.")
    if scan.demo_mode:
        result = TestResult(
            command="pytest",
            passed=12,
            failed=0,
            status="passed",
            demo_mode=True,
            note="Demo mode reports the bundled suite. pytest was not executed on the host.",
        )
    else:
        workspace = store.workspace_for(scan.id)
        if workspace is None:
            raise APIError(422, "Unable to run tests.", "The scan workspace is no longer available.")
        result = _execute_pytest(workspace)

    def apply(live: Scan, current: Finding) -> None:
        current.test_result = result
        _set_stage(live, "tests", "completed" if result.status == "passed" else "failed")
        _log(
            live,
            f"pytest · {result.passed} passed · {result.failed} failed",
            "good" if result.status == "passed" else "bad",
        )
        _activity(live, "Tests passed" if result.status == "passed" else "Tests failed", result.note)

    store.mutate_finding(finding_id, apply)
    return result


def _execute_pytest(workspace: Path) -> TestResult:
    if sandbox.mode_label() == "development_fallback":
        note = "Development fallback: pytest ran on the host because Docker is unavailable. The command is fixed and is not taken from a model."
    else:
        note = "pytest ran inside the Docker sandbox."
    completed = sandbox.run(["pytest", "-q"], workspace)
    if completed.returncode == 127:
        raise APIError(503, "Unable to run tests.", "pytest is not available in the sandbox.")
    passed = _count(completed.stdout + completed.stderr, r"(\d+) passed")
    failed = _count(completed.stdout + completed.stderr, r"(\d+) failed")
    status = "passed" if completed.returncode == 0 and failed == 0 else "failed"
    return TestResult(
        command="pytest",
        passed=passed,
        failed=failed,
        status=status,  # type: ignore[arg-type]
        demo_mode=False,
        note=note,
    )


def _count(text: str, pattern: str) -> int:
    match = re.search(pattern, text)
    return int(match.group(1)) if match else 0


def verify_fix(finding_id: str):
    scan, finding = _load_finding(finding_id)
    applied = finding.status in {"applied", "verified", "failed"} and finding.fix is not None
    tests_passed = finding.test_result is not None and finding.test_result.status == "passed"
    still_present = False
    regression_passed = False
    if applied and tests_passed and scan.demo_mode:
        still_present = False
        regression_passed = True
    elif applied and tests_passed:
        workspace = store.workspace_for(scan.id)
        if workspace is None:
            raise APIError(422, "Unable to verify the patch.", "The scan workspace is no longer available.")
        rescanned: list[Finding] = []
        cursor = 1000
        for result in run_scanners(workspace):
            for raw in result.findings:
                cursor += 1
                rescanned.append(_materialize(scan.id, cursor, raw))
        still_present = any(matches(finding, candidate) for candidate in rescanned)
        regression_passed = regression_ok(scan.findings, rescanned, finding)
    verification = build_verification(
        applied=applied,
        tests_passed=tests_passed,
        still_present=still_present,
        regression_passed=regression_passed,
        scanner=finding.scanner,
        file=finding.file,
        line=finding.line,
        title=finding.title,
        demo_mode=scan.demo_mode,
    )
    verification.summary = ai_service.explain_verification(verification.summary, verification.verified)

    def apply(live: Scan, current: Finding) -> None:
        current.verification = verification
        if verification.verified:
            current.status = "verified"
            current.verified_at = _iso()
            _set_stage(live, "verification", "completed")
            _log(live, f"Original vulnerability no longer detected · {current.file}:{current.line}", "good")
            _activity(live, "Security re-scan completed", verification.summary)
            _activity(live, "PATCH VERIFIED", current.title)
        else:
            current.status = "failed"
            _set_stage(live, "verification", "failed")
            _log(live, verification.summary, "bad")
            _activity(live, "Verification failed", verification.summary)

    _, updated = store.mutate_finding(finding_id, apply)
    if updated.verification is None:
        raise APIError(500, "Unable to verify the patch.", "Verification did not produce evidence.")
    return updated.verification
