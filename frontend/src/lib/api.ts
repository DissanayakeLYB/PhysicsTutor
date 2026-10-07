export type ChatRole = "user" | "tutor";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  /** Set when the reply is a client-side failure notice rather than a tutor answer. */
  error?: boolean;
};

/** A turn exactly as the backend expects it (oldest first). */
export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Base URL of the FastAPI backend. Set `VITE_API_URL` in `frontend/.env` to point
 * somewhere else, e.g. `http://192.168.1.20:8000` when testing from a phone.
 *
 * The backend is a plain HTTP service: nothing here imports or reads backend
 * files, it just fetches.
 */
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

/** Maps chat state onto the wire format the backend expects. */
export function toChatTurns(messages: ChatMessage[]): ChatTurn[] {
  return messages
    .filter((message) => !message.error)
    .map((message) => ({
      role: message.role === "tutor" ? "assistant" : "user",
      content: message.content,
    }));
}

/** Keeps server-provided details from filling the whole chat bubble. */
function shortDetail(detail: unknown): string | null {
  if (typeof detail !== "string") return null;

  const trimmed = detail.trim();
  if (!trimmed) return null;

  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}

/**
 * Sends one message to the tutor and resolves with the reply text.
 *
 * Throws with a short, human-readable message when the backend is unreachable or
 * answers with an error; the UI renders that as a friendly error bubble.
 */
export async function send(message: string, history: ChatTurn[] = []): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });
  } catch {
    throw new Error(`could not reach the tutor service at ${API_URL}.`);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = shortDetail((payload as { detail?: unknown } | null)?.detail);

    throw new Error(detail ?? `the tutor service returned HTTP ${response.status}.`);
  }

  const reply = (payload as { reply?: unknown } | null)?.reply;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("the tutor service sent an empty reply.");
  }

  return reply;
}
