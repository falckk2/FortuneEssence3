"""Deterministic need extraction and Swedish reply templates for small/local models."""

from __future__ import annotations

import re
from typing import Any

from .state import UserNeeds

_GOAL_PATTERNS: list[tuple[str, tuple[str, ...]]] = [
    ("sleep", ("sömn", "sova", "somna", "somnar", "sömnig", "sleep", "insomnia", "vaknar")),
    ("stress", ("stress", "oro", "orolig", "spänd", "anxious", "anxiety")),
    ("energy", ("energi", "trött", "pigg", "energy", "tired", "fatigue")),
    ("focus", ("fokus", "koncentration", "focus", "concentration")),
    ("skin", ("hud", "acne", "skin", "eksem")),
    ("mood", ("humör", "deppig", "mood", "glad")),
    ("respiratory", ("näsa", "hosta", "congestion", "cold")),
]

_USE_METHOD_PATTERNS: list[tuple[str, tuple[str, ...]]] = [
    ("pillow", ("kuddspray", "kudde", "pillow", "spray")),
    ("diffuser", ("diffuser", "diffus", "doftljus")),
    ("topical", ("hud", "topical", "massage", "händer", "tinning")),
    ("bath", ("bad", "bath", "badkar")),
]

_SENSITIVITY_PATTERNS: list[tuple[str, tuple[str, ...]]] = [
    ("none mentioned", ("ingen allergi", "inga allergier", "no allergies", "no allergy")),
    ("pregnancy", ("gravid", "pregnant")),
    ("children", ("barn", "children", "baby", "bebis")),
    ("sensitive skin", ("känslig hud", "sensitive skin")),
]

_GOAL_PRODUCT_KEYWORDS: dict[str, str] = {
    "sleep": "lavender,lavendel,chamomile,kamomill,sleep",
    "stress": "lavender,lavendel,bergamot,frankincense,stress",
    "energy": "peppermint,rosemary,citrus,energy",
    "focus": "rosemary,peppermint,lemon,focus",
    "skin": "tea tree,lavender,frankincense",
    "mood": "bergamot,orange,ylang",
    "respiratory": "eucalyptus,peppermint,tea tree",
}

_SMALL_MODEL_MARKERS = ("0.6b", "0.5b", "1b", "tiny", "small")


def _normalize(text: str) -> str:
    return re.sub(r"[^\w\såäö]", " ", text.lower())


def _match_patterns(text: str, patterns: list[tuple[str, tuple[str, ...]]]) -> str:
    norm = _normalize(text)
    for value, keys in patterns:
        if any(k in norm for k in keys):
            return value
    return ""


def extract_needs_from_text(text: str) -> UserNeeds:
    """Pull structured needs from one customer message without an LLM."""
    needs: UserNeeds = {}
    goal = _match_patterns(text, _GOAL_PATTERNS)
    use_method = _match_patterns(text, _USE_METHOD_PATTERNS)
    sensitivity = _match_patterns(text, _SENSITIVITY_PATTERNS)
    if goal:
        needs["goal"] = goal
    if use_method:
        needs["use_method"] = use_method
    if sensitivity:
        needs["sensitivity"] = sensitivity
    return needs


def extract_needs_from_messages(texts: list[str]) -> UserNeeds:
    """Merge needs extracted from every customer message in the session."""
    merged: UserNeeds = {}
    for text in texts:
        merged = merge_needs(merged, extract_needs_from_text(text))
    return merged


def merge_needs(existing: UserNeeds, new: UserNeeds) -> UserNeeds:
    merged: UserNeeds = {**existing}
    for key, value in new.items():
        if value:
            merged[key] = value
    return merged


def goal_product_keywords(goal: str) -> str:
    return _GOAL_PRODUCT_KEYWORDS.get(goal, goal or "essential")


def is_small_local_model(model_name: str) -> bool:
    lower = model_name.lower()
    return any(marker in lower for marker in _SMALL_MODEL_MARKERS)


def template_gather_reply(lang: str, needs: UserNeeds) -> str | None:
    """Fixed Swedish/English follow-up questions — avoids LLM repetition."""
    goal = (needs.get("goal") or "").strip()
    use_method = (needs.get("use_method") or "").strip()

    if lang == "sv":
        if goal == "sleep" and not use_method:
            return (
                "Vad fint att du vill sova bättre! Lavendel är ofta en bra början. "
                "Vill du använda oljan i en diffuser, som kuddspray, eller utspädd på huden?"
            )
        if goal == "stress" and not use_method:
            return (
                "Jag förstår — stress kan vara tungt att bära. "
                "Vill du dofta oljan i en diffuser, använda den på huden, eller i ett varmt bad?"
            )
        if goal and not use_method:
            return (
                "Tack för att du berättar! Hur tänker du använda oljan — "
                "i en diffuser, på huden, eller på något annat sätt?"
            )
        if not needs.get("sensitivity"):
            return (
                "Innan jag rekommenderar något: är du gravid, har du små barn hemma, "
                "känslig hud eller några allergier jag bör tänka på?"
            )
        return None

    if goal == "sleep" and not use_method:
        return (
            "I'm glad you're looking for better sleep — lavender is often a great starting point. "
            "Would you like to use it in a diffuser, as a pillow spray, or diluted on the skin?"
        )
    if goal and not use_method:
        return "Thanks for sharing! How would you like to use the oil — diffuser, topical, or something else?"
    if not needs.get("sensitivity"):
        return "Before I recommend something: any pregnancy, young children, sensitive skin, or allergies I should know about?"
    return None


def _goal_ack_sv(goal: str) -> str:
    return {
        "sleep": "att du vill sova bättre",
        "stress": "att du vill minska stress och hitta mer ro",
        "energy": "att du söker mer energi",
        "focus": "att du vill förbättra fokus",
    }.get(goal, "att du söker naturligt välmående")


def _usage_sv(use_method: str) -> str:
    return {
        "pillow": (
            "Blanda 2–3 droppar med lite vatten i en liten sprayflaska och mista lätt över kudden "
            "ca 15 minuter före läggdags. Skaka flaskan före varje användning."
        ),
        "diffuser": (
            "Tillsätt 2–3 droppar i din diffuser 30–45 minuter före du går och lägger dig."
        ),
        "topical": (
            "Blanda 1–2 droppar med en tesked bärarolja (t.ex. jojoba) och massera in på handleder eller tinningar."
        ),
        "bath": (
            "Blanda 4–6 droppar med en tesked bärarolja eller en skvätt mjölk, "
            "rör ut i badvattnet och njut i 15–20 minuter."
        ),
    }.get(use_method, "")


def build_template_recommendation(lang: str, needs: UserNeeds, products: list[dict[str, Any]]) -> str:
    """Reliable recommendation copy when the local model is too small for fluent Swedish."""
    picks = [p for p in products if p.get("name") or p.get("name_sv")][:2]
    if not picks:
        if lang == "sv":
            return (
                "Tack för att du delar med dig! Just nu hittar jag tyvärr inga passande produkter i lager. "
                "Prova gärna igen om en stund, eller skriv till oss så hjälper vi dig personligen."
            )
        return "Thanks for sharing! I couldn't find matching in-stock products right now — please try again shortly."

    goal = (needs.get("goal") or "").strip()
    use_method = (needs.get("use_method") or "").strip()

    if lang == "sv":
        lines = [f"Tack för att du delar med dig — jag förstår {_goal_ack_sv(goal)}."]
        for p in picks:
            name = p.get("name_sv") or p.get("name", "Olja")
            price = p.get("price_sek")
            price_txt = f" ({int(price)} kr)" if price else ""
            lines.append(f"\n**{name}**{price_txt} passar bra för ditt behov.")

        usage = _usage_sv(use_method)
        if usage:
            lines.append(f"\nSå här kan du använda den:\n{usage}")

        lines.append(
            "\nEn sak att ha i åtanke: eteriska oljor är koncentrerade — "
            "använd alltid utspädd på huden och undvik kontakt med ögonen."
        )
        lines.append("\nVill du veta mer om dosering eller en annan olja? Fråga gärna vidare!")
        return "\n".join(lines)

    lines = [f"Thanks for sharing — I understand you're looking for help with {goal or 'wellness'}."]
    for p in picks:
        name = p.get("name", "Oil")
        price = p.get("price_sek")
        price_txt = f" ({int(price)} SEK)" if price else ""
        lines.append(f"\n**{name}**{price_txt} looks like a good match.")
    lines.append("\nLet me know if you'd like more detail on how to use it!")
    return "\n".join(lines)


def sanitize_advisor_reply(text: str, lang: str) -> str:
    """Light cleanup for common small-model artifacts."""
    cleaned = text
    cleaned = re.sub(r"\$\s*(\d+(?:\.\d+)?)", r"\1 kr", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    if lang == "sv":
        cleaned = cleaned.replace("**Warmly Acknowledging:**", "")
        cleaned = cleaned.replace("**Why Lavender Works:**", "")
        cleaned = cleaned.replace("**Här är vad jag förstår:**", "")
    return cleaned.strip()