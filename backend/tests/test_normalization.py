from pathlib import Path

from app.scanners.bandit_scanner import parse_bandit
from app.scanners.base import BaseScanner, ToolResult, map_severity
from app.scanners.semgrep_scanner import parse_semgrep


def test_severity_mapping() -> None:
    assert map_severity("CRITICAL") == "critical"
    assert map_severity("ERROR") == "high"
    assert map_severity("HIGH") == "high"
    assert map_severity("WARNING") == "medium"
    assert map_severity("MEDIUM") == "medium"
    assert map_severity("INFO") == "low"
    assert map_severity("LOW") == "low"
    assert map_severity(None) == "medium"


def test_semgrep_normalization() -> None:
    findings = parse_semgrep(
        {
            "results": [
                {
                    "check_id": "python.lang.security.audit.sqli",
                    "path": "app/database.py",
                    "start": {"line": 42},
                    "extra": {
                        "message": "SQL Injection",
                        "severity": "ERROR",
                        "metadata": {"cwe": ["CWE-89: SQL Injection"]},
                    },
                }
            ]
        }
    )
    assert len(findings) == 1
    assert findings[0].scanner == "Semgrep"
    assert findings[0].severity == "high"
    assert findings[0].file == "app/database.py"
    assert findings[0].line == 42
    assert findings[0].cwe == "CWE-89"


def test_bandit_normalization() -> None:
    findings = parse_bandit(
        {
            "results": [
                {
                    "filename": "app/archive.py",
                    "line_number": 27,
                    "issue_severity": "HIGH",
                    "issue_text": "Command injection via shell call.",
                    "issue_cwe": {"id": 78},
                }
            ]
        }
    )
    assert findings[0].scanner == "Bandit"
    assert findings[0].severity == "high"
    assert findings[0].cwe == "CWE-78"
    assert findings[0].line == 27


def test_missing_scanner_does_not_crash(tmp_path: Path) -> None:
    class Missing(BaseScanner):
        name = "Semgrep"
        binary = "semgrep-not-installed-xyz"

        def _scan(self, root: Path) -> ToolResult:
            raise AssertionError("unavailable scanners must not run")

    result = Missing().scan(tmp_path)
    assert result.available is False
    assert result.findings == []
