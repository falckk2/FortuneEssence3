import asyncio
import json
import uuid
from typing import AsyncGenerator

from dotenv import load_dotenv
load_dotenv()  # must run before agent imports so USE_OLLAMA and keys are set

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from agent import agent, AgentState

app = FastAPI(title="FortuneEssence Oil Advisor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://fortuneessence.vercel.app",  # update to your actual Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None  # None = new session


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    products: list = []
    gathered_enough: bool = False


# ---------------------------------------------------------------------------
# Streaming endpoint (SSE)
# ---------------------------------------------------------------------------

@app.post("/api/advisor/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming SSE endpoint. Each chunk is a JSON line prefixed with 'data: '.
    Connect from the frontend via EventSource or fetch with ReadableStream.
    """
    session_id = request.session_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": session_id}}

    initial_state: AgentState = {
        "messages": [HumanMessage(content=request.message)],
        "user_needs": {},
        "gathered_enough": False,
        "rag_context": "",
        "recommended_products": [],
        "language": "en",
    }

    async def event_generator() -> AsyncGenerator[str, None]:
        # Send session id immediately so the client can store it
        yield f"data: {json.dumps({'type': 'session', 'session_id': session_id})}\n\n"

        try:
            # Run the graph — stream node outputs as they complete
            async for event in agent.astream(initial_state, config=config):
                for node_name, node_output in event.items():
                    if node_name == "gather_needs":
                        # Stream the clarifying question back
                        messages = node_output.get("messages", [])
                        if messages:
                            last_msg = messages[-1]
                            yield f"data: {json.dumps({'type': 'message', 'content': last_msg.content, 'node': node_name})}\n\n"

                    elif node_name == "recommend":
                        messages = node_output.get("messages", [])
                        products = node_output.get("recommended_products", [])
                        if messages:
                            last_msg = messages[-1]
                            yield f"data: {json.dumps({'type': 'recommendation', 'content': last_msg.content, 'products': products, 'node': node_name})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Non-streaming endpoint (simpler for initial integration)
# ---------------------------------------------------------------------------

@app.post("/api/advisor/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Simple non-streaming endpoint — easier to integrate initially."""
    session_id = request.session_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": session_id}}

    initial_state: AgentState = {
        "messages": [HumanMessage(content=request.message)],
        "user_needs": {},
        "gathered_enough": False,
        "rag_context": "",
        "recommended_products": [],
        "language": "en",
    }

    try:
        final_state = await agent.ainvoke(initial_state, config=config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Last AI message is the reply
    from langchain_core.messages import AIMessage
    last_ai = next(
        (m for m in reversed(final_state["messages"]) if isinstance(m, AIMessage)),
        None,
    )
    reply = last_ai.content if last_ai else ""

    return ChatResponse(
        session_id=session_id,
        reply=reply,
        products=final_state.get("recommended_products", []),
        gathered_enough=final_state.get("gathered_enough", False),
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}
