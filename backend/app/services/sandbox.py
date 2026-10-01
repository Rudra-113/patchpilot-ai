import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass
class SandboxResult:
    mode: str
    returncode: int
    stdout: str
    stderr: str


class SandboxService:
    """Runs a fixed argv. It never accepts shell text from a model."""

    def docker_available(self) -> bool:
        if shutil.which("docker") is None:
            return False
        try:
            completed = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                text=True,
                timeout=8,
                shell=False,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired):
            return False
        return completed.returncode == 0

    def mode_label(self) -> str:
        if self.docker_available():
            return "docker"
        return "development_fallback"

    def run(self, argv: list[str], cwd: Path, timeout: int = 90) -> SandboxResult:
        if any(not isinstance(part, str) or part.strip() == "" for part in argv):
            raise ValueError("Sandbox commands must be a list of arguments.")
        if self.docker_available():
            command = [
                "docker",
                "run",
                "--rm",
                "--network",
                "none",
                "-v",
                f"{cwd.resolve()}:/work",
                "-w",
                "/work",
                "python:3.12-slim",
                *argv,
            ]
            mode = "docker"
            workdir = cwd
        else:
            command = list(argv)
            mode = "development_fallback"
            workdir = cwd
        try:
            completed = subprocess.run(
                command,
                cwd=workdir,
                capture_output=True,
                text=True,
                timeout=timeout,
                shell=False,
                check=False,
            )
        except subprocess.TimeoutExpired:
            return SandboxResult(mode=mode, returncode=124, stdout="", stderr="The command timed out.")
        except OSError as exc:
            return SandboxResult(mode=mode, returncode=127, stdout="", stderr=str(exc))
        return SandboxResult(
            mode=mode,
            returncode=completed.returncode,
            stdout=completed.stdout[-8000:],
            stderr=completed.stderr[-4000:],
        )


sandbox = SandboxService()
