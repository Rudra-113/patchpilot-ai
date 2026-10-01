import re
import zipfile
from pathlib import Path

from app.core.config import github_token
from app.core.errors import APIError
from app.scanners.base import run_argv

GITHUB_URL = re.compile(r"^https://github\.com/[\w.-]+/[\w.-]+(?:\.git)?/?$")
BRANCH_NAME = re.compile(r"^[A-Za-z0-9._/-]{1,80}$")
MAX_ARCHIVE_BYTES = 50_000_000


def validate_github_url(url: str) -> str:
    cleaned = url.strip()
    if not GITHUB_URL.match(cleaned):
        raise APIError(422, "Enter a GitHub repository URL.", "Use https://github.com/owner/repository")
    return cleaned[:-4] if cleaned.endswith(".git") else cleaned.rstrip("/")


def validate_branch(branch: str) -> str:
    cleaned = branch.strip() or "main"
    if not BRANCH_NAME.match(cleaned):
        raise APIError(422, "Enter a branch name.", "Branch names cannot contain spaces or shell syntax.")
    return cleaned


def repository_name(url: str) -> str:
    return validate_github_url(url).rstrip("/").split("/")[-1]


def extract_zip(upload: Path, workspace: Path) -> None:
    try:
        archive = zipfile.ZipFile(upload)
    except zipfile.BadZipFile as exc:
        raise APIError(422, "Upload a ZIP archive.", "The file is not a valid ZIP.") from exc
    with archive:
        total = sum(info.file_size for info in archive.infolist())
        if total > MAX_ARCHIVE_BYTES:
            raise APIError(422, "Upload a smaller archive.", "The uncompressed archive exceeds 50 MB.")
        root = workspace.resolve()
        for info in archive.infolist():
            target = (root / info.filename).resolve()
            if not target.is_relative_to(root) or info.filename.startswith("/") or ".." in Path(info.filename).parts:
                raise APIError(422, "The archive was rejected.", "A path inside the ZIP escapes the workspace.")
        archive.extractall(root)


def clone_repository(url: str, branch: str, workspace: Path) -> None:
    remote = validate_github_url(url)
    token = github_token()
    if token:
        owner_repo = remote.removeprefix("https://github.com/")
        remote = f"https://x-access-token:{token}@github.com/{owner_repo}"
    completed = run_argv(
        ["git", "clone", "--depth", "1", "--branch", branch, remote, str(workspace)],
        workspace.parent,
        timeout=60,
    )
    if completed.returncode != 0 or not workspace.exists():
        raise APIError(422, "Unable to clone the repository.", "Git could not read that URL and branch.")
