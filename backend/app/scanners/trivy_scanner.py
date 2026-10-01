import json
from pathlib import Path

from app.scanners.base import BaseScanner, RawFinding, ToolResult, map_severity, run_argv


def parse_trivy(payload: dict) -> list[RawFinding]:
    findings: list[RawFinding] = []
    for result in payload.get("Results") or []:
        target = str(result.get("Target") or "repository")
        for vuln in result.get("Vulnerabilities") or []:
            title = str(vuln.get("Title") or vuln.get("VulnerabilityID") or "Vulnerable dependency")
            findings.append(
                RawFinding(
                    scanner="Trivy",
                    severity=map_severity(str(vuln.get("Severity") or "medium")),
                    title=title[:90],
                    file=target,
                    line=1,
                    description=str(vuln.get("Description") or title)[:400],
                    cwe="CWE-1395",
                    code=f"{vuln.get('PkgName', '')}@{vuln.get('InstalledVersion', '')}",
                )
            )
        for misconfig in result.get("Misconfigurations") or []:
            line = int(((misconfig.get("CauseMetadata") or {}).get("StartLine") or 1))
            title = str(misconfig.get("Title") or misconfig.get("ID") or "Misconfiguration")
            findings.append(
                RawFinding(
                    scanner="Trivy",
                    severity=map_severity(str(misconfig.get("Severity") or "low")),
                    title=title[:90],
                    file=target,
                    line=line,
                    description=str(misconfig.get("Description") or title)[:400],
                    cwe="CWE-250",
                    code=title,
                )
            )
    return findings


class TrivyScanner(BaseScanner):
    name = "Trivy"
    binary = "trivy"

    def _scan(self, root: Path) -> ToolResult:
        completed = run_argv(
            ["trivy", "fs", "--format", "json", "--quiet", "--scanners", "vuln,misconfig,secret", str(root)],
            root,
            timeout=180,
        )
        if not completed.stdout.strip():
            return ToolResult(
                name=self.name,
                available=True,
                findings=[],
                error=(completed.stderr or "Trivy returned no report.").strip()[:300],
            )
        return ToolResult(name=self.name, available=True, findings=parse_trivy(json.loads(completed.stdout)))
