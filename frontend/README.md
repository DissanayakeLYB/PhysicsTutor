# Physics Tutor — frontend

A minimal chat interface for a physics tutoring assistant. React + TypeScript + Vite,
Tailwind CSS v4 and shadcn/ui components (Radix primitives).

It talks to the FastAPI service in [`../backend`](../backend) over HTTP only: one
`fetch` to `POST /chat`, no shared code and no filesystem paths into the other
folder.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173 (also served on your LAN for phone testing)
npm run build    # typecheck + production build
npm run typecheck
```

Start the backend first (see [`../backend/README.md`](../backend/README.md)), or the
composer will show an error bubble.

## Backend contract

All backend access lives in [`src/lib/api.ts`](src/lib/api.ts):

```ts
export async function send(message: string, history?: ChatTurn[]): Promise<string>
```

It POSTs `{ message, history }` to `${VITE_API_URL}/chat` and resolves with the
`reply` string, or throws with a short message that the UI shows as an error bubble.
`toChatTurns` converts chat state into the wire format (`{ role: "user" | "assistant",
content }`), skipping error notices.

Point it somewhere other than `http://localhost:8000` (for example your machine's LAN
IP, when opening the UI on a phone) by copying `.env.example` to `.env` and editing
`VITE_API_URL`.

## Layout notes

- `Card` frames the whole chat; the message list lives in a Radix `ScrollArea`, so only
  the messages scroll while the header and composer stay put.
- The composer is a `<form>`, so Enter submits on both desktop and mobile keyboards.
- Mobile is full-bleed (`h-dvh`, safe-area aware); from 640px up the card is centred with
  a max width. Input/button tap targets are 44px on small screens and the input uses a
  16px font size below `sm` so iOS Safari does not zoom on focus.
