import os
os.environ['PYTHONIOENCODING'] = 'utf-8'

from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent.parent / ".env")

from langchain_core.messages import HumanMessage, AIMessage
from agent.graph import agent

session_id = "cli-test-session"
config = {"configurable": {"thread_id": session_id}}

print("\nFortuneEssence Oil Advisor - CLI Test")
print("Type 'quit' to exit\n")

while True:
    user_input = input("You: ").strip()
    if user_input.lower() in ("quit", "exit", "q"):
        break
    if not user_input:
        continue

    state = {
        "messages": [HumanMessage(content=user_input)],
        "user_needs": {},
        "gathered_enough": False,
        "rag_context": "",
        "recommended_products": [],
        "language": "en",
    }

    result = agent.invoke(state, config=config)

    last_ai = next(
        (m for m in reversed(result["messages"]) if isinstance(m, AIMessage)), None
    )
    if last_ai:
        print(f"\nAdvisor: {last_ai.content}\n")
