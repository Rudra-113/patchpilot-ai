import time

from app.core.config import demo_mode


def _finding_id(client, title: str = "SQL Injection") -> str:
    scan = client.get("/api/scans/current").json()
    match = next(item for item in scan["findings"] if item["title"] == title)
    return match["id"]


def test_seeded_demo_score_and_finding(client) -> None:
    response = client.get("/api/scans/current")
    assert response.status_code == 200
    body = response.json()
    assert body["demoMode"] is True
    assert body["repository"] == "patchpilot-demo"
    assert body["securityScore"] == 72
    assert body["findingsCount"] == 10
    assert body["fixedCount"] == 0
    sql = next(item for item in body["findings"] if item["title"] == "SQL Injection")
    assert sql["severity"] == "critical"
    assert sql["scanner"] == "Semgrep"
    assert sql["cwe"] == "CWE-89"
    assert sql["file"] == "app/database.py"
    assert sql["line"] == 42
    assert sql["status"] == "unfixed"
    assert sql["fix"] is None
    assert "unsanitized user-controlled input" in sql["analysis"]["summary"]


def test_verification_requires_evidence_then_proves_the_fix(client) -> None:
    finding_id = _finding_id(client)
    early = client.post(f"/api/findings/{finding_id}/verify")
    assert early.status_code == 200
    assert early.json()["verified"] is False
    assert early.json()["checks"]["securityScan"] == "pending"
    assert client.get("/api/scans/current").json()["securityScore"] == 72

    generated = client.post(f"/api/findings/{finding_id}/generate-fix")
    assert generated.status_code == 200
    fix = generated.json()["fix"]
    assert fix["source"] == "demo"
    assert 'cursor.execute(query, (user_id,))' in fix["after"]
    assert generated.json()["status"] == "fix_ready"

    applied = client.post(f"/api/findings/{finding_id}/apply-fix")
    assert applied.status_code == 200
    assert applied.json()["status"] == "applied"

    tested = client.post(f"/api/findings/{finding_id}/test")
    assert tested.status_code == 200
    assert tested.json()["passed"] == 12
    assert tested.json()["failed"] == 0
    assert tested.json()["demoMode"] is True

    verified = client.post(f"/api/findings/{finding_id}/verify")
    assert verified.status_code == 200
    evidence = verified.json()
    assert evidence["verified"] is True
    assert evidence["checks"]["securityScan"] == "passed"
    assert evidence["checks"]["tests"] == "passed"
    assert evidence["checks"]["originalVulnerability"] == "resolved"
    assert evidence["checks"]["regression"] == "passed"
    assert "app/database.py:42" in evidence["summary"]

    scan = client.get("/api/scans/current").json()
    assert scan["securityScore"] == 79
    assert scan["fixedCount"] == 1
    activity = client.get(f"/api/activity/{scan['id']}").json()
    assert any(event["title"] == "PATCH VERIFIED" for event in activity)


def test_ai_mock_without_keys(client, monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    assert demo_mode() is True
    finding_id = _finding_id(client, "Hardcoded Secret")
    response = client.post(f"/api/findings/{finding_id}/generate-fix")
    assert response.status_code == 200
    assert response.json()["fix"]["source"] == "demo"
    assert "os.environ" in response.json()["fix"]["after"]


def test_generate_fix_refuses_when_provider_missing(client, monkeypatch) -> None:
    monkeypatch.setenv("DEMO_MODE", "false")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    finding_id = _finding_id(client)
    response = client.post(f"/api/findings/{finding_id}/generate-fix")
    assert response.status_code == 503
    assert response.json()["detail"]["message"] == "Unable to generate patch."
    assert "AI service unavailable" in response.json()["detail"]["detail"]


def test_demo_scan_completes(client) -> None:
    created = client.post("/api/scan", json={"url": "https://github.com/patchpilot/patchpilot-demo", "branch": "main"})
    assert created.status_code == 200
    scan_id = created.json()["id"]
    assert created.json()["demoMode"] is True
    body = created.json()
    for _ in range(30):
        body = client.get(f"/api/scans/{scan_id}").json()
        if body["status"] != "running":
            break
        time.sleep(0.05)
    assert body["status"] == "completed"
    assert body["findingsCount"] == 10
    assert body["securityScore"] == 72
    assert any("No model call was made" in line["message"] for line in body["logs"])
    assert "fetched" in body["note"].lower() or "not fetched" in body["note"].lower()
