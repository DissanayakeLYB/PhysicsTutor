export type ChatRole = "user" | "tutor";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  /** Set when the reply is a client-side failure notice rather than a tutor answer. */
  error?: boolean;
};

/**
 * Backend entry point for the physics tutor.
 *
 * Replace the body of this function with your real implementation: the UI only
 * depends on this signature. Resolve with the tutor's reply as plain text, or
 * throw to have the UI render a friendly error bubble.
 *
 * If your backend needs the whole conversation (for follow-ups like "why is
 * that?"), add a second parameter for the history the caller already keeps in
 * state.
 */
export async function send(message: string): Promise<string> {
  // --- Placeholder implementation: replace once the backend is wired up. ---
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return `Placeholder reply. You asked: "${message}". Wire up send() in src/lib/api.ts to return a real answer.`;
}
