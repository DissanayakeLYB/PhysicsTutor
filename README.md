# Physics Tutor — chat UI

A minimal chat interface for a physics tutoring assistant. React + TypeScript + Vite,
Tailwind CSS v4 and shadcn/ui components (Radix primitives).

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173 (also served on your LAN for phone testing)
npm run build    # typecheck + production build
npm run typecheck
```

## Wiring up the backend

The UI calls a single function, `send`, in [`src/lib/api.ts`](src/lib/api.ts):

```ts
export async function send(message: string): Promise<string>
```

Replace its placeholder body with your real implementation. Resolve with the tutor's
reply as plain text; throw on failure and the UI renders a friendly error bubble and
re-enables the composer. If your backend needs the full conversation for follow-ups,
add a parameter for the history that `App` already keeps in state.

## Layout notes

- `Card` frames the whole chat; the message list lives in a Radix `ScrollArea`, so only
  the messages scroll while the header and composer stay put.
- The composer is a `<form>`, so Enter submits on both desktop and mobile keyboards.
- Mobile is full-bleed (`h-dvh`, safe-area aware); from 640px up the card is centred with
  a max width. Input/button tap targets are 44px on small screens and the input uses a
  16px font size below `sm` so iOS Safari does not zoom on focus.
