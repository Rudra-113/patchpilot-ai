from pathlib import Path

from app.core.errors import APIError
from app.schemas.api import Finding, FixProposal


def review_patch(finding: Finding, fix: FixProposal) -> None:
    path = Path(fix.file)
    if path.is_absolute() or ".." in path.parts or not fix.file.strip():
        raise APIError(422, "Unable to generate patch.", "The patch path is not allowed.")
    if Path(fix.file) != Path(finding.file):
        raise APIError(422, "Unable to generate patch.", "The patch targeted a different file than the finding.")
    if not fix.before.strip() or not fix.after.strip() or fix.before == fix.after:
        raise APIError(422, "Unable to generate patch.", "The patch did not change the vulnerable code.")
    if finding.code.strip() and finding.code.strip() not in fix.before and fix.before.strip() not in finding.code:
        raise APIError(422, "Unable to generate patch.", "The patch did not match the scanned code.")


def safe_workspace_file(workspace: Path, relative: str) -> Path:
    path = Path(relative)
    if path.is_absolute() or ".." in path.parts:
        raise APIError(422, "Unable to apply patch.", "The patch path is not allowed.")
    root = workspace.resolve()
    target = (root / path).resolve()
    if not target.is_relative_to(root):
        raise APIError(422, "Unable to apply patch.", "The patch path escapes the workspace.")
    return target


def apply_replacement(workspace: Path, fix: FixProposal) -> None:
    target = safe_workspace_file(workspace, fix.file)
    if not target.is_file():
        raise APIError(422, "Unable to apply patch.", "The target file does not exist in the workspace.")
    text = target.read_text(encoding="utf-8")
    count = text.count(fix.before)
    if count == 0:
        raise APIError(422, "Unable to apply patch.", "The original snippet was not found. The patch was not applied.")
    if count > 1:
        raise APIError(422, "Unable to apply patch.", "The snippet is not unique. The patch was not applied.")
    target.write_text(text.replace(fix.before, fix.after, 1), encoding="utf-8")
