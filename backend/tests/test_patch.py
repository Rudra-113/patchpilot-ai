from pathlib import Path

import pytest

from app.core.errors import APIError
from app.schemas.api import Finding, FixProposal
from app.services.patching import apply_replacement, review_patch


def _finding() -> Finding:
    return Finding(
        id="finding-001",
        severity="critical",
        title="SQL Injection",
        scanner="Semgrep",
        file="app/database.py",
        line=42,
        status="unfixed",
        description="concatenated SQL",
        why_it_matters="the query can change",
        cwe="CWE-89",
        code='query = "SELECT * FROM users WHERE id=" + user_id\ncursor.execute(query)',
    )


def _fix(**overrides: str) -> FixProposal:
    payload = {
        "summary": "Bind the parameter",
        "explanation": "The statement text stays fixed.",
        "before": _finding().code,
        "after": 'query = "SELECT * FROM users WHERE id = ?"\ncursor.execute(query, (user_id,))',
        "file": "app/database.py",
        "source": "demo",
    }
    payload.update(overrides)
    return FixProposal(**payload)  # type: ignore[arg-type]


def test_review_rejects_path_escape() -> None:
    with pytest.raises(APIError):
        review_patch(_finding(), _fix(file="../secrets.py"))


def test_review_rejects_unrelated_file() -> None:
    with pytest.raises(APIError):
        review_patch(_finding(), _fix(file="app/other.py"))


def test_apply_replaces_one_snippet(tmp_path: Path) -> None:
    target = tmp_path / "app"
    target.mkdir()
    file = target / "database.py"
    file.write_text(f"header\n{_finding().code}\nfooter\n", encoding="utf-8")
    apply_replacement(tmp_path, _fix())
    text = file.read_text(encoding="utf-8")
    assert "cursor.execute(query, (user_id,))" in text
    assert "header" in text and "footer" in text


def test_apply_rejects_missing_snippet(tmp_path: Path) -> None:
    target = tmp_path / "app"
    target.mkdir()
    (target / "database.py").write_text("untouched = True\n", encoding="utf-8")
    with pytest.raises(APIError):
        apply_replacement(tmp_path, _fix())
    assert "untouched" in (target / "database.py").read_text(encoding="utf-8")
