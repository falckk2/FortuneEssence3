"""Select exactly one user-facing payload from a graph run."""

from __future__ import annotations

from langchain_core.messages import AIMessage


def _last_ai_content(messages: list) -> str | None:
    for message in reversed(messages):
        if isinstance(message, AIMessage) and message.content:
            return message.content
    return None


def pick_single_user_response(node_events: list[tuple[str, dict]]) -> dict | None:
    """
    Collapse a full graph run into at most one advisor reply.

    Priority: recommendation > clarifying question.
    Internal nodes (retrieve_knowledge, search_products, detect_language) are ignored.
    """
    gather_payload: dict | None = None
    recommend_payload: dict | None = None

    for node_name, node_output in node_events:
        if node_name == "recommend":
            content = _last_ai_content(node_output.get("messages", []))
            if content:
                recommend_payload = {
                    "type": "recommendation",
                    "content": content,
                    "products": node_output.get("recommended_products", []),
                    "node": node_name,
                }
        elif node_name == "gather_needs":
            if node_output.get("gathered_enough"):
                continue
            content = _last_ai_content(node_output.get("messages", []))
            if content:
                gather_payload = {
                    "type": "message",
                    "content": content,
                    "node": node_name,
                }

    return recommend_payload or gather_payload