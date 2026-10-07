"""FastAPI backend for the physics tutor chat UI.

One endpoint, `POST /chat`, which forwards the conversation to Gemini and returns
the model's reply as JSON. Run it with:

    uvicorn main:app --reload --port 8000
"""

import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from prompts import SYSTEM_PROMPT

# Read backend/.env into the environment before looking for the key.
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

# "*" keeps local development friction-free: the UI is served from a different
# port (5173 by default) and often from another device on the LAN. Set
# ALLOWED_ORIGINS in .env to a comma-separated list to lock this down.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]

app = FastAPI(title="Physics Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HistoryMessage(BaseModel):
    """One earlier turn of the conversation, oldest first."""

    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(description="The student's newest message.")
    history: list[HistoryMessage] = Field(
        default_factory=list,
        description="Earlier turns, oldest first. Optional; omit for a fresh conversation.",
    )


class ChatResponse(BaseModel):
    reply: str


def reason(error: Exception) -> str:
    """A short reason for the client; the full error still goes to the server log."""
    text = str(getattr(error, "message", None) or error).strip()

    return text if len(text) <= 300 else f"{text[:300]}…"


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """Send the conversation to Gemini and return the tutor's text reply."""
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not set. Copy .env.example to .env in the backend folder and add your key.",
        )

    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="The 'message' field must not be empty.")

    contents = [
        types.Content(
            role="model" if turn.role == "assistant" else "user",
            parts=[types.Part.from_text(text=turn.content)],
        )
        for turn in request.history
    ]
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                # No tools are exposed, so automatic function calling is noise.
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            ),
        )
    except Exception as error:  # noqa: BLE001 - report whatever Gemini/network raised
        print(f"[chat] Gemini call failed: {error}", flush=True)
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {reason(error)}") from error

    reply = (response.text or "").strip()
    if not reply:
        raise HTTPException(status_code=502, detail="Gemini returned an empty reply.")

    return ChatResponse(reply=reply)
