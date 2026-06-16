"""Regression: prompt templates with JSON examples must render without KeyError."""

import sys
import unittest
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[1]
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from agent.prompts import (  # noqa: E402
    GATHER_EXTRACTION_PROMPT,
    RECOMMEND_PROMPT,
    render_prompt,
)


class RenderPromptTests(unittest.TestCase):
    def test_gather_extraction_renders_json_example_placeholders(self):
        rendered = render_prompt(
            GATHER_EXTRACTION_PROMPT,
            conversation="Customer: help with sleep",
            current_needs="{}",
        )
        self.assertIn("Customer: help with sleep", rendered)
        self.assertIn('"reply":', rendered)
        self.assertNotIn("{conversation}", rendered)

    def test_recommend_renders_catalog_placeholders(self):
        rendered = render_prompt(
            RECOMMEND_PROMPT,
            user_needs='{"goal": "sleep"}',
            rag_context="lavender helps sleep",
            products='[{"name": "Lavender"}]',
            language="English",
        )
        self.assertIn("lavender helps sleep", rendered)
        self.assertIn("Lavender", rendered)
        self.assertIn("English", rendered)


if __name__ == "__main__":
    unittest.main()