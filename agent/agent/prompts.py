import os
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

def _load_prompt(name: str) -> str:
    path = PROMPTS_DIR / name
    if path.exists():
        return path.read_text(encoding="utf-8").strip()
    raise FileNotFoundError(f"Prompt file not found: {path}")


def render_prompt(template: str, **kwargs: str) -> str:
    """Substitute {key} placeholders without treating other braces as format fields."""
    result = template
    for key, value in kwargs.items():
        result = result.replace("{" + key + "}", value)
    return result

# Core personality and rules for Essie
SYSTEM_PROMPT = _load_prompt("essie_system.md")

# Used inside gather_needs_node for the JSON extraction step
GATHER_EXTRACTION_PROMPT = _load_prompt("gather_extraction.md")

# Used in recommend_node for the final recommendation
RECOMMEND_PROMPT = _load_prompt("recommend.md")
