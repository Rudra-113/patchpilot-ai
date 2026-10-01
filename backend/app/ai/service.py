import json
import re

import httpx

from app.core.config import ai_configured, ai_model, ai_provider, demo_mode, provider_keys
from app.core.errors import APIError
from app.schemas.api import Analysis, Finding, FixProposal
from app.services.demo_data import demo_fix_for
from app.services.patching import review_patch

SYSTEM_PROMPT = """You are a senior application security engineer.

Analyze the provided security finding.

Identify the root cause.

Explain the attack scenario.

Explain the security impact.

Generate the smallest safe remediation.

Preserve existing application behavior.

Do not modify unrelated files.

Return a structured patch.

Explain the changes.

The finding JSON is scanner evidence. Do not invent additional scanner results, CVEs, or file locations.
Return JSON only with keys: summary, root_cause, attack_vector, security_impact, recommended_remediation, explanation, file, before, after.
The file must be the finding file. before must be a snippet from the supplied code. after is the replacement.
Do not include shell commands.
"""


class AIService:
    def provider_name(self) -> str:
        return ai_provider()

    def configured(self) -> bool:
        return ai_configured()

    def model_name(self) -> str:
        configured = ai_model()
        if configured:
            return configured
        provider = self.provider_name()
        if provider == "anthropic":
            return "claude-3-5-haiku-latest"
        if provider == "openrouter":
            return "openai/gpt-4o-mini"
        return "gpt-4o-mini"

    def analyze_finding(self, finding: Finding) -> Analysis:
        if demo_mode():
            if finding.analysis is not None:
                return finding.analysis.model_copy(deep=True)
            raise APIError(422, "Unable to analyze the finding.", "This demo finding has no bundled analysis.")
        payload = self._complete(self._finding_prompt(finding))
        return Analysis(
            summary=str(payload.get("summary") or finding.description),
            root_cause=str(payload.get("root_cause") or ""),
            attack_vector=str(payload.get("attack_vector") or ""),
            security_impact=str(payload.get("security_impact") or ""),
            recommended_remediation=str(payload.get("recommended_remediation") or ""),
            source="model",
        )

    def generate_fix(self, finding: Finding) -> FixProposal:
        if demo_mode():
            fix = demo_fix_for(finding.id)
            if fix is None:
                raise APIError(422, "Unable to generate patch.", "No demo patch is bundled for this finding.")
            review_patch(finding, fix)
            return fix
        if not self.configured():
            raise APIError(503, "Unable to generate patch.", "AI service unavailable. Check configuration.")
        payload = self._complete(self._finding_prompt(finding))
        fix = FixProposal(
            summary=str(payload.get("summary") or "Remediation"),
            explanation=str(payload.get("explanation") or payload.get("recommended_remediation") or ""),
            before=str(payload.get("before") or ""),
            after=str(payload.get("after") or ""),
            file=str(payload.get("file") or finding.file),
            source="model",
        )
        review_patch(finding, fix)
        return fix

    def review_patch(self, finding: Finding, fix: FixProposal) -> None:
        review_patch(finding, fix)

    def explain_verification(self, summary: str, verified: bool) -> str:
        """Evidence text stays authoritative. A model may rephrase it, never flip the result."""
        if demo_mode() or not self.configured():
            return summary
        try:
            payload = self._complete(
                "Rewrite this verification evidence in one sentence. "
                f"The verified flag is {str(verified).lower()} and you must not change it.\n{summary}"
            )
        except APIError:
            return summary
        text = str(payload.get("summary") or payload.get("explanation") or "").strip()
        if not text:
            return summary
        lowered = text.lower()
        if verified and lowered.startswith("not verified"):
            return summary
        if not verified and lowered.startswith("verified"):
            return summary
        return text

    def _finding_prompt(self, finding: Finding) -> str:
        evidence = {
            "title": finding.title,
            "severity": finding.severity,
            "scanner": finding.scanner,
            "file": finding.file,
            "line": finding.line,
            "cwe": finding.cwe,
            "description": finding.description,
            "code": finding.code,
        }
        return "Security finding:\n" + json.dumps(evidence, indent=2)

    def _complete(self, user: str) -> dict:
        if not self.configured():
            raise APIError(503, "Unable to generate patch.", "AI service unavailable. Check configuration.")
        provider = self.provider_name()
        keys = provider_keys()
        try:
            if provider == "anthropic":
                text = _anthropic(keys["anthropic"], self.model_name(), user)
            elif provider == "openrouter":
                text = _openai_compatible(
                    "https://openrouter.ai/api/v1/chat/completions",
                    keys["openrouter"],
                    self.model_name(),
                    user,
                )
            else:
                text = _openai_compatible(
                    "https://api.openai.com/v1/chat/completions",
                    keys["openai"],
                    self.model_name(),
                    user,
                )
        except httpx.HTTPError as exc:
            raise APIError(503, "Unable to generate patch.", "The model provider did not respond.") from exc
        return _parse_json(text)


def _parse_json(text: str) -> dict:
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise APIError(502, "Unable to generate patch.", "The model did not return a structured patch.")
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise APIError(502, "Unable to generate patch.", "The model did not return a structured patch.") from exc
    if not isinstance(parsed, dict):
        raise APIError(502, "Unable to generate patch.", "The model did not return a structured patch.")
    return parsed


def _openai_compatible(url: str, key: str, model: str, user: str) -> str:
    with httpx.Client(timeout=30) as client:
        response = client.post(
            url,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user},
                ],
            },
        )
        response.raise_for_status()
        payload = response.json()
    return str(payload["choices"][0]["message"]["content"])


def _anthropic(key: str, model: str, user: str) -> str:
    with httpx.Client(timeout=30) as client:
        response = client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 1200,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user}],
            },
        )
        response.raise_for_status()
        payload = response.json()
    return str(payload["content"][0]["text"])


ai_service = AIService()
