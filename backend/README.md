# Physics Tutor — backend

A small FastAPI service with a single endpoint, `POST /chat`. It prepends the
system prompt from [`prompts.py`](prompts.py) to the conversation you send, asks
Gemini for a reply, and returns that reply as JSON. The React app in
[`../frontend`](../frontend) talks to it over HTTP only — no shared files, no
imports across the two folders.

## Running it locally

From this folder (`backend/`):

```bash
python -m venv .venv
source .venv/Scripts/activate     # Windows (Git Bash);  macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env              # then paste your key into .env
uvicorn main:app --reload --port 8000
```

The API is then at <http://localhost:8000> and interactive docs at
<http://localhost:8000/docs>.

### The API key

The key is read from the `GEMINI_API_KEY` environment variable, loaded from
`.env` in this folder via `python-dotenv`. Never commit `.env` — it is already in
the repo-root `.gitignore`. Get a key from
<https://aistudio.google.com/apikey>.

Optional overrides, also read from `.env`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `GEMINI_MODEL` | `gemini-flash-latest` | Which Gemini model to call. |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins. Set to `http://localhost:5173` to lock it down. |

## `POST /chat`

Request — `history` is optional, and turns are oldest first:

```json
{
  "message": "Why does a heavier ball fall at the same rate?",
  "history": [
    { "role": "user", "content": "Hi!" },
    { "role": "assistant", "content": "Hi! What are we working on?" }
  ]
}
```

`role` is `"user"` or `"assistant"`; `"assistant"` turns are sent to Gemini as
the model's own earlier replies.

Success — `200`:

```json
{ "reply": "Because gravity accelerates every mass equally…" }
```

Errors — the body is always JSON:

| Status | When |
| --- | --- |
| `400` | `message` was empty after trimming. |
| `422` | FastAPI's validation error, e.g. a missing `message` or an unknown role. |
| `500` | `GEMINI_API_KEY` is missing. |
| `502` | The Gemini call failed or came back empty; `detail` carries the reason. |

The frontend renders `detail` inside an error bubble, so it keeps the text short.

## Changing the tutor's behaviour

Edit `SYSTEM_PROMPT` in [`prompts.py`](prompts.py). It is prepended to every
conversation as Gemini's `system_instruction`, so the model sees it before the
student's first message.
