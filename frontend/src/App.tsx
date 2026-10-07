import { Atom, SendHorizontal } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { LoadingDots } from "@/components/loading-dots";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { send, toChatTurns, type ChatMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const createId = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "tutor",
  content:
    "Hi! I'm your physics tutor. Ask me anything — draw a free-body diagram with me, check your work on a kinematics problem, or ask why a formula works the way it does.",
};

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the conversation grows. Scrolling the
  // Radix viewport directly (rather than scrollIntoView on a sentinel) lands on
  // the true bottom, including the list's bottom padding.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages, isSending]);

  const addMessage = (message: ChatMessage) => setMessages((prev) => [...prev, message]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = draft.trim();
    if (!text || isSending) return;

    addMessage({ id: createId(), role: "user", content: text });
    setDraft("");
    setIsSending(true);

    try {
      // `messages` is still the conversation without this turn, so it is exactly
      // the history the backend wants; the new message goes in on its own.
      const reply = await send(text, toChatTurns(messages));
      addMessage({ id: createId(), role: "tutor", content: reply });
    } catch (error) {
      addMessage({
        id: createId(),
        role: "tutor",
        content:
          error instanceof Error && error.message
            ? `Sorry, I couldn't answer that: ${error.message}`
            : "I couldn't reach the tutor service just now. Check your connection and try again.",
        error: true,
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-muted/40 sm:p-6">
      <Card className="h-dvh w-full max-w-2xl gap-0 overflow-hidden rounded-none border-0 py-0 shadow-none sm:h-[min(44rem,calc(100dvh-3rem))] sm:rounded-xl sm:border sm:shadow-sm">
        <CardHeader className="flex-row items-center gap-3 border-b px-4 py-3 sm:px-6 sm:py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Atom className="size-4" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="truncate text-base">Physics Tutor</CardTitle>
            <CardDescription className="truncate text-xs sm:text-sm">
              Mechanics, waves, thermodynamics and more
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 p-0">
          <ScrollArea viewportRef={viewportRef} className="h-full">
            <div
              role="log"
              aria-live="polite"
              aria-label="Conversation with the physics tutor"
              className="flex flex-col gap-4 p-4 sm:p-6"
            >
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {isSending && (
                <MessageBubble
                  message={{ id: "pending", role: "tutor", content: "" }}
                  pending
                />
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="p-0">
          <form
            onSubmit={handleSubmit}
            className="flex w-full items-center gap-2 border-t px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-4 sm:pb-4"
          >
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask a physics question…"
              aria-label="Message the physics tutor"
              autoComplete="off"
              autoCapitalize="sentences"
              className="h-11 sm:h-9"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim() || isSending}
              aria-label="Send message"
              className="size-11 shrink-0 sm:size-9"
            >
              <SendHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

function MessageBubble({
  message,
  pending = false,
}: {
  message: ChatMessage;
  pending?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <span className="mb-1 px-1 text-xs font-medium text-muted-foreground">
        {isUser ? "You" : "Tutor"}
      </span>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap sm:max-w-[75%]",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground",
          message.error && "border border-destructive/30 bg-destructive/5",
        )}
      >
        {pending ? <LoadingDots /> : message.content}
      </div>
    </div>
  );
}
