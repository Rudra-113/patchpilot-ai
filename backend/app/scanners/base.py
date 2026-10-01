import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass
class RawFinding:
    scanner: str
    severity: str
    title: str
    file: str
    line: int
    description: str
    cwe: str
    code: str = ""


@dataclass
class ToolResult:
    name: str
    available: bool
    findings: list[RawFinding]
    error: str | None = None


SEVERITY_MAP = {
    "critical": "critical",
    "error": "high",
    "high": "high",
    "warning": "medium",
    "medium": "medium",
    "info": "low",
    "low": "low",
}


def map_severity(value: str | None) -> str:
    if not value:
        return "medium"
    return SEVERITY_MAP.get(value.strip().lower(), "medium")


def format_cwe(value: object) -> str:
    if value is None:
        return "Unclassified"
    text = str(value).strip()
    if not text:
        return "Unclassified"
    if text.upper().startswith("CWE-"):
        suffix = text.split("-", 1)[1].split(":")[0].strip()
        return f"CWE-{suffix}" if suffix else "Unclassified"
    if text.isdigit():
        return f"CWE-{text}"
    return text


def read_snippet(root: Path, relative: str, line: int, radius: int = 2) -> str:
    path = root / relative
    if not path.is_file():
        return ""
    try:
        rows = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return ""
    if line < 1:
        line = 1
    start = max(0, line - 1 - radius)
    end = min(len(rows), line + radius)
    return "\n".join(rows[start:end])


def run_argv(argv: list[str], cwd: Path, timeout: int = 120) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        argv,
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=timeout,
        shell=False,
        check=False,
    )


class BaseScanner:
    name = "scanner"
    binary = ""

    def available(self) -> bool:
        return shutil.which(self.binary) is not None

    def scan(self, root: Path) -> ToolResult:
        if not self.available():
            return ToolResult(name=self.name, available=False, findings=[])
        try:
            return self._scan(root)
        except Exception as exc:  # noqa: BLE001 - scanners must not take down a scan
            return ToolResult(name=self.name, available=True, findings=[], error=str(exc)[:300])

    def _scan(self, root: Path) -> ToolResult:
        raise NotImplementedError
