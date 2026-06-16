"""Ensure one user-facing payload per graph run."""

import sys
import unittest
from pathlib import Path

from langchain_core.messages import AIMessage

AGENT_DIR = Path(__file__).resolve().parents[1]
if str(AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(AGENT_DIR))

from agent.stream_output import pick_single_user_response  # noqa: E402


class PickSingleResponseTests(unittest.TestCase):
    def test_prefers_recommendation_over_gather_in_same_run(self):
        events = [
            (
                "gather_needs",
                {
                    "gathered_enough": True,
                    "messages": [AIMessage(content="Should not show")],
                },
            ),
            (
                "recommend",
                {
                    "messages": [AIMessage(content="Final recommendation")],
                    "recommended_products": [{"name": "Lavender"}],
                },
            ),
        ]
        payload = pick_single_user_response(events)
        self.assertEqual(payload["type"], "recommendation")
        self.assertEqual(payload["content"], "Final recommendation")
        self.assertEqual(len(payload["products"]), 1)

    def test_returns_gather_when_no_recommendation(self):
        events = [
            (
                "gather_needs",
                {
                    "gathered_enough": False,
                    "messages": [AIMessage(content="How will you use it?")],
                },
            ),
        ]
        payload = pick_single_user_response(events)
        self.assertEqual(payload["type"], "message")
        self.assertEqual(payload["content"], "How will you use it?")

    def test_ignores_internal_nodes(self):
        events = [
            ("retrieve_knowledge", {"rag_context": "lavender"}),
            ("search_products", {"recommended_products": []}),
            (
                "gather_needs",
                {
                    "gathered_enough": False,
                    "messages": [AIMessage(content="One question only")],
                },
            ),
        ]
        payload = pick_single_user_response(events)
        self.assertEqual(payload["content"], "One question only")


if __name__ == "__main__":
    unittest.main()