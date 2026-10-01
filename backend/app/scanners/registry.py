from pathlib import Path

from app.scanners.bandit_scanner import BanditScanner
from app.scanners.base import BaseScanner, ToolResult
from app.scanners.gitleaks_scanner import GitleaksScanner
from app.scanners.pip_audit_scanner import PipAuditScanner
from app.scanners.semgrep_scanner import SemgrepScanner
from app.scanners.trivy_scanner import TrivyScanner

SCANNERS: list[BaseScanner] = [
    SemgrepScanner(),
    BanditScanner(),
    PipAuditScanner(),
    GitleaksScanner(),
    TrivyScanner(),
]


def scanner_status() -> list[tuple[str, bool]]:
    return [(scanner.name, scanner.available()) for scanner in SCANNERS]


def run_scanners(root: Path) -> list[ToolResult]:
    return [scanner.scan(root) for scanner in SCANNERS]
