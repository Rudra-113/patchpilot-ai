import os


def _flag(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


def demo_mode() -> bool:
    return _flag("DEMO_MODE", "true")


def demo_delay() -> float:
    try:
        return max(0.0, float(os.getenv("PATCHPILOT_DEMO_DELAY", "0.42")))
    except ValueError:
        return 0.42


def github_token() -> str:
    return os.getenv("GITHUB_TOKEN", "").strip()


def ai_model() -> str:
    return os.getenv("AI_MODEL", "").strip()


def provider_keys() -> dict[str, str]:
    return {
        "openrouter": os.getenv("OPENROUTER_API_KEY", "").strip(),
        "openai": os.getenv("OPENAI_API_KEY", "").strip(),
        "anthropic": os.getenv("ANTHROPIC_API_KEY", "").strip(),
    }


def ai_provider() -> str:
    keys = provider_keys()
    if keys["openrouter"]:
        return "openrouter"
    if keys["openai"]:
        return "openai"
    if keys["anthropic"]:
        return "anthropic"
    return "none"


def ai_configured() -> bool:
    return ai_provider() != "none"
