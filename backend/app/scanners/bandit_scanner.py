import json
from pathlib import Path

from app.scanners.base import BaseScanner, RawFinding, ToolResult, format_cwe, map_severity, read_snippet, run_argv


def parse_bandit(payload: dict, root: Path | None = None) -> list[RawFinding]:
    findings: list[RawFinding] = []
    for result in payload.get("results") or []:
        cwe = (result.get("issue_cwe") or {}).get("id")
        filename = str(result.get("filename") or "")
        line = int(result.get("line_number") or 1)
        message = str(result.get("issue_text") or "Bandit finding")
        findings.append(
            RawFinding(
                scanner="Bandit",
                severity=map_severity(str(result.get("issue_severity") or "medium")),
                title=message.split("\n", 1)[0][:90],
                file=filename,
                line=line,
                description=message,
                cwe=format_cwe(cwe),
                code=read_snippet(root, filename, line) if root else "",
            )
        )
    return findings


class BanditScanner(BaseScanner):
    name = "Bandit"
    binary = "bandit"

    def _scan(self, root: Path) -> ToolResult:
        completed = run_argv(["bandit", "-r", str(root), "-f", "json", "-q"], root)
        if not completed.stdout.strip():
            return ToolResult(name=self.name, available=True, findings=[], error="Bandit returned no report.")
        payload = json.loads(completed.stdout)
        return ToolResult(name=self.name, available=True, findings=parse_bandit(payload, root))
