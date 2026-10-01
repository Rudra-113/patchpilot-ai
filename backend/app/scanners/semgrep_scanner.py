import json
from pathlib import Path

from app.scanners.base import BaseScanner, RawFinding, ToolResult, format_cwe, map_severity, read_snippet, run_argv


def parse_semgrep(payload: dict, root: Path | None = None) -> list[RawFinding]:
    findings: list[RawFinding] = []
    for result in payload.get("results") or []:
        extra = result.get("extra") or {}
        path = str(result.get("path") or "")
        line = int((result.get("start") or {}).get("line") or 1)
        metadata = extra.get("metadata") or {}
        cwe_raw = metadata.get("cwe")
        if isinstance(cwe_raw, list) and cwe_raw:
            cwe_raw = cwe_raw[0]
        message = str(extra.get("message") or result.get("check_id") or "Semgrep finding")
        title = message.split("\n", 1)[0][:90]
        findings.append(
            RawFinding(
                scanner="Semgrep",
                severity=map_severity(str(extra.get("severity") or "medium")),
                title=title,
                file=path,
                line=line,
                description=message,
                cwe=format_cwe(cwe_raw),
                code=read_snippet(root, path, line) if root else "",
            )
        )
    return findings


class SemgrepScanner(BaseScanner):
    name = "Semgrep"
    binary = "semgrep"

    def _scan(self, root: Path) -> ToolResult:
        completed = run_argv(
            ["semgrep", "scan", "--config", "auto", "--json", "--quiet", "--metrics=off", str(root)],
            root,
        )
        if not completed.stdout.strip():
            error = completed.stderr.strip()[:300] or "Semgrep returned no report."
            return ToolResult(name=self.name, available=True, findings=[], error=error)
        payload = json.loads(completed.stdout)
        return ToolResult(name=self.name, available=True, findings=parse_semgrep(payload, root))
