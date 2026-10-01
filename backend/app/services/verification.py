from app.schemas.api import Finding, Verification, VerificationChecks


def matches(original: Finding, candidate: Finding) -> bool:
    if candidate.file != original.file:
        return False
    same_line = candidate.line == original.line
    same_title = candidate.title.lower() == original.title.lower()
    same_cwe = bool(original.cwe) and candidate.cwe == original.cwe and original.cwe != "Unclassified"
    return same_line or same_title or same_cwe


def regression_ok(previous: list[Finding], rescanned: list[Finding], target: Finding) -> bool:
    known = {(item.file, item.line, item.title.lower()) for item in previous if item.id != target.id}
    for item in rescanned:
        if matches(target, item):
            continue
        key = (item.file, item.line, item.title.lower())
        if key not in known:
            return False
    return True


def build_verification(
    *,
    applied: bool,
    tests_passed: bool,
    still_present: bool,
    regression_passed: bool,
    scanner: str,
    file: str,
    line: int,
    title: str,
    demo_mode: bool,
) -> Verification:
    rescanned = applied and tests_passed
    security_ok = rescanned and not still_present
    if not tests_passed:
        test_status = "failed"
    else:
        test_status = "passed"
    if not rescanned:
        scan_status = "pending"
        original_status = "pending"
        regression_status = "pending"
    elif still_present:
        scan_status = "failed"
        original_status = "still_present"
        regression_status = "pending"
    elif not regression_passed:
        scan_status = "passed"
        original_status = "resolved"
        regression_status = "failed"
    else:
        scan_status = "passed"
        original_status = "resolved"
        regression_status = "passed"
    checks = VerificationChecks(
        security_scan=scan_status,
        tests=test_status,
        original_vulnerability=original_status,
        regression=regression_status,
    )
    verified = security_ok and regression_passed and tests_passed
    if verified:
        summary = f"{scanner} no longer reports {title} at {file}:{line}."
    elif still_present:
        summary = f"{scanner} still reports the original vulnerability at {file}:{line}."
    elif not tests_passed:
        summary = "Tests have not passed, so the patch cannot be verified."
    elif not applied:
        summary = "The patch has not been applied."
    else:
        summary = "Regression check failed. The rescan reported a new finding."
    return Verification(
        verified=verified,
        checks=checks,
        summary=summary,
        before=f"{title} detected",
        after=f"{title} no longer detected" if verified else f"{title} still detected",
        demo_mode=demo_mode,
    )
