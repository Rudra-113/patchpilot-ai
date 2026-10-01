import json
import tempfile
from pathlib import Path

from app.scanners.base import BaseScanner, RawFinding, ToolResult, read_snippet, run_argv


def parse_gitleaks(payload: object, root: Path | None = None) -> list[RawFinding]:
    rows = payload if isinstance(payload, list) else []
    findings: list[RawFinding] = []
    for row in rows:
        filename = str(row.get("File") or row.get("file") or "")
        line = int(row.get("StartLine") or row.get("startLine") or 1)
        description = str(row.get("Description") or row.get("description") or "Secret detected")
        findings.append(
            RawFinding(
                scanner="Gitleaks",
                severity="critical",
                title="Hardcoded Secret",
                file=filename,
                line=line,
                description=description,
                cwe="CWE-798",
                code=read_snippet(root, filename, line) if root else "",
            )
        )
    return findings


class GitleaksScanner(BaseScanner):
    name = "Gitleaks"
    binary = "gitleaks"

    def _scan(self, root: Path) -> ToolResult:
        with tempfile.TemporaryDirectory() as tmp:
            report = Path(tmp) / "gitleaks.json"
            completed = run_argv(
                [
                    "gitleaks",
                    "detect",
                    "--source",
                    str(root),
                    "--report-format",
                    "json",
                    "--report-path",
                    str(report),
                    "--no-git",
                    "--exit-code",
                    "0",
                ],
                root,
            )
            if not report.is_file():
                return ToolResult(
                    name=self.name,
                    available=True,
                    findings=[],
                    error=(completed.stderr or "Gitleaks did not write a report.").strip()[:300],
                )
            text = report.read_text(encoding="utf-8", errors="replace").strip() or "[]"
            payload = json.loads(text)
        return ToolResult(name=self.name, available=True, findings=parse_gitleaks(payload, root))
