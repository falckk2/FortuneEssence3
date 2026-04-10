from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from .state import AgentState
from .nodes import (
    detect_language_node,
    gather_needs_node,
    retrieve_knowledge_node,
    search_products_node,
    recommend_node,
)


def _should_continue_gathering(state: AgentState) -> str:
    """Route: keep gathering info or proceed to retrieval."""
    if state.get("gathered_enough"):
        return "retrieve"
    return "gather"


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    # Register nodes
    graph.add_node("detect_language", detect_language_node)
    graph.add_node("gather_needs", gather_needs_node)
    graph.add_node("retrieve_knowledge", retrieve_knowledge_node)
    graph.add_node("search_products", search_products_node)
    graph.add_node("recommend", recommend_node)

    # Entry point
    graph.set_entry_point("detect_language")

    # detect_language → gather_needs
    graph.add_edge("detect_language", "gather_needs")

    # gather_needs → conditional branch
    # One pass per API call: if not enough info yet, return the clarifying question
    # to the user and wait for their next message (session history continues the convo).
    graph.add_conditional_edges(
        "gather_needs",
        _should_continue_gathering,
        {
            "gather": END,             # return clarifying question, await next user message
            "retrieve": "retrieve_knowledge",
        },
    )

    # retrieve → search → recommend → END
    graph.add_edge("retrieve_knowledge", "search_products")
    graph.add_edge("search_products", "recommend")
    graph.add_edge("recommend", END)

    return graph


def compile_graph(use_memory: bool = True):
    """
    Compile the LangGraph agent.

    Args:
        use_memory: If True, uses in-memory checkpointing (dev/single-instance).
                    For production, swap MemorySaver for PostgresSaver pointing at Supabase.
    """
    graph = build_graph()
    checkpointer = MemorySaver() if use_memory else None
    return graph.compile(checkpointer=checkpointer)


# Singleton compiled graph — import this in the API
agent = compile_graph()
