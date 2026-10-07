import { cn } from "@/lib/utils";

/**
 * Three bouncing dots shown inside the tutor's bubble while a reply is pending.
 */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Tutor is typing"
      className={cn("flex items-center gap-1.5 py-1", className)}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          style={{ animationDelay: `${index * 150}ms` }}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70"
        />
      ))}
    </span>
  );
}
