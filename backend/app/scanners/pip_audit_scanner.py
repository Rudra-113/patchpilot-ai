import json
from pathlib import Path

from app.scanners.base import BaseScanner, RawFinding, ToolResult, run_argv


def parse_pip_audit(payload: object, requirements: Path | None = None) -> list[RawFinding]:
    if isinstance(payload, dict):
        dependencies = payload.get("dependencies") or []
    elif isinstance(payload, list):
        dependencies = payload
    else:
        return []
    findings: list[RawFinding] = []
    for dependency in dependencies:
        name = str(dependency.get("name") or "dependency")
        version = str(dependency.get("version") or "")
        for vuln in dependency.get("vulns") or []:
            advisory = str(vuln.get("id") or "advisory")
            description = str(vuln.get("description") or f"{name} {version} is affected by {advisory}.")
            line = _requirement_line(requirements, name)
            findings.append(
                RawFinding(
                    scanner="pip-audit",
                    severity="high",
                    title=f"Vulnerable dependency {name}",
                    file="requirements.txt" if requirements else name,
                    line=line,
                    description=description.split("\n", 1)[0][:400],
                    cwe="CWE-1395",
                    code=f"{name}=={version}" if version else name,
                )
            )
    return findings


def _requirement_line(requirements: Path | None, package: str) -> int:
    if requirements is None or not requirements.is_file():
        return 1
    for index, row in enumerate(requirements.read_text(encoding="utf-8", errors="replace").splitlines(), start=1):
        if row.lower().startswith(package.lower()):
            return index
    return 1


class PipAuditScanner(BaseScanner):
    name = "pip-audit"
    binary = "pip-audit"

    def _scan(self, root: Path) -> ToolResult:
        requirements = root / "requirements.txt"
        if not requirements.is_file():
            return ToolResult(name=self.name, available=True, findings=[], error="No requirements.txt in the repository.")
        completed = run_argv(["pip-audit", "-r", str(requirements), "-f", "json"], root, timeout=180)
        if not completed.stdout.strip():
            return ToolResult(
                name=self.name,
                available=True,
                findings=[],
                error=(completed.stderr or "pip-audit returned no report.").strip()[:300],
            )
        payload = json.loads(completed.stdout)
        return ToolResult(name=self.name, available=True, findings=parse_pip_audit(payload, requirements))
