"""FABLE-007 verification: _extract_json handles braces inside string values."""

import sys
import unittest
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[1]
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from agent.nodes import _extract_json  # noqa: E402


class ExtractJsonTests(unittest.TestCase):
    def test_parses_braces_inside_string_values(self):
        raw = '{"reply": "try {lavender} oil", "gathered_enough": true}'
        result = _extract_json(raw)
        self.assertEqual(result["reply"], "try {lavender} oil")
        self.assertTrue(result["gathered_enough"])

    def test_strips_markdown_fences(self):
        raw = """```json
{"reply": "ok {brace}", "gathered_enough": false}
```"""
        result = _extract_json(raw)
        self.assertEqual(result["reply"], "ok {brace}")
        self.assertFalse(result["gathered_enough"])

    def test_rejects_non_object_json(self):
        with self.assertRaises(ValueError):
            _extract_json("[1, 2, 3]")

    def test_raises_when_no_object_present(self):
        with self.assertRaises(ValueError):
            _extract_json("no json here")


if __name__ == "__main__":
    unittest.main()