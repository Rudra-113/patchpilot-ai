import threading
from pathlib import Path

from app.schemas.api import Finding, Scan


class Store:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.scans: dict[str, Scan] = {}
        self.active_id: str | None = None
        self.workspaces: dict[str, Path] = {}

    def reset(self) -> None:
        with self._lock:
            self.scans.clear()
            self.active_id = None
            self.workspaces.clear()

    def add(self, scan: Scan, workspace: Path | None = None) -> None:
        with self._lock:
            self.scans[scan.id] = scan
            self.active_id = scan.id
            if workspace is not None:
                self.workspaces[scan.id] = workspace

    def workspace_for(self, scan_id: str) -> Path | None:
        with self._lock:
            return self.workspaces.get(scan_id)

    def set_workspace(self, scan_id: str, path: Path) -> None:
        with self._lock:
            self.workspaces[scan_id] = path

    def snapshot(self, scan_id: str) -> Scan | None:
        with self._lock:
            scan = self.scans.get(scan_id if scan_id != "current" else (self.active_id or ""))
            if scan is None:
                return None
            scan.refresh_counts()
            return scan.model_copy(deep=True)

    def summaries(self) -> list[Scan]:
        with self._lock:
            scans = list(self.scans.values())
            for scan in scans:
                scan.refresh_counts()
            scans.sort(key=lambda item: item.created_at, reverse=True)
            return [scan.model_copy(deep=True) for scan in scans]

    def mutate(self, scan_id: str, fn) -> Scan:
        with self._lock:
            scan = self.scans.get(scan_id)
            if scan is None:
                raise KeyError(scan_id)
            fn(scan)
            scan.refresh_counts()
            return scan.model_copy(deep=True)

    def find(self, finding_id: str) -> tuple[Scan, Finding]:
        with self._lock:
            for scan in self.scans.values():
                for finding in scan.findings:
                    if finding.id == finding_id:
                        scan.refresh_counts()
                        copied = scan.model_copy(deep=True)
                        match = next(item for item in copied.findings if item.id == finding_id)
                        return copied, match
            raise KeyError(finding_id)

    def mutate_finding(self, finding_id: str, fn) -> tuple[Scan, Finding]:
        with self._lock:
            for scan in self.scans.values():
                for finding in scan.findings:
                    if finding.id == finding_id:
                        fn(scan, finding)
                        scan.refresh_counts()
                        copied = scan.model_copy(deep=True)
                        match = next(item for item in copied.findings if item.id == finding_id)
                        return copied, match
            raise KeyError(finding_id)


store = Store()
