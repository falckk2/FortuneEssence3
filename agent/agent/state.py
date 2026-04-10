from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages


class UserNeeds(TypedDict, total=False):
    goal: str           # e.g. "sleep", "focus", "stress relief", "skin care"
    mood: str           # e.g. "anxious", "tired", "unmotivated"
    scent_preference: str  # e.g. "floral", "woody", "citrus", "minty"
    concerns: str       # e.g. "headaches", "congestion", "acne"
    sensitivity: str    # e.g. "sensitive skin", "pregnancy", "children"
    use_method: str     # e.g. "diffuse", "topical", "bath"


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    user_needs: UserNeeds
    gathered_enough: bool
    rag_context: str
    recommended_products: list
    language: str       # "en" or "sv"
