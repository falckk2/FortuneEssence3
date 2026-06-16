"""Guards for Swedish stickiness and minimum gathering before recommend."""

import sys
import unittest
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[1]
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from agent.needs_heuristics import extract_needs_from_messages, extract_needs_from_text  # noqa: E402
from agent.nodes import (  # noqa: E402
    _needs_sufficient,
    _resolve_language,
)


class ResolveLanguageTests(unittest.TestCase):
    def test_stays_swedish_on_short_follow_up(self):
        lang = _resolve_language(
            ["hjälp med sömn", "diffuser"],
            previous="sv",
        )
        self.assertEqual(lang, "sv")

    def test_detects_swedish_from_first_message(self):
        lang = _resolve_language(["jag vill sova bättre"], previous=None)
        self.assertEqual(lang, "sv")

    def test_detects_english_when_customer_switches(self):
        lang = _resolve_language(
            ["help with sleep", "in a diffuser at night"],
            previous=None,
        )
        self.assertEqual(lang, "en")


class ExtractNeedsTests(unittest.TestCase):
    def test_detects_sleep_goal_in_swedish(self):
        needs = extract_needs_from_text("hade varit bra med bättre sömn")
        self.assertEqual(needs.get("goal"), "sleep")

    def test_detects_pillow_spray_method(self):
        needs = extract_needs_from_text("kuddspray? det låter intressant")
        self.assertEqual(needs.get("use_method"), "pillow")

    def test_merges_needs_across_messages(self):
        needs = extract_needs_from_messages([
            "hallå, letar efter ngt som kan hjälpa mig med sömn",
            "gärna som en kuddspray",
        ])
        self.assertEqual(needs.get("goal"), "sleep")
        self.assertEqual(needs.get("use_method"), "pillow")


class NeedsSufficientTests(unittest.TestCase):
    def test_first_turn_requires_use_method(self):
        self.assertFalse(_needs_sufficient({"goal": "sleep"}, human_count=1))
        self.assertTrue(
            _needs_sufficient({"goal": "sleep", "use_method": "diffuser"}, human_count=1)
        )

    def test_second_turn_allows_goal_only(self):
        self.assertTrue(_needs_sufficient({"goal": "sleep"}, human_count=2))

    def test_empty_goal_never_enough(self):
        self.assertFalse(_needs_sufficient({"use_method": "diffuser"}, human_count=3))


if __name__ == "__main__":
    unittest.main()