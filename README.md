# VueNotes AI — Full-Stack Vue + Supabase + Gemini Course

A multi-user notes app with AI summarization, auto-tagging, and RAG chat — built from scratch with Vue 3, Supabase, and Google Gemini. This is the companion repository for the **CodeWithLari** YouTube series.

📺 **[Watch the full course on YouTube →](https://youtu.be/T5JsvgvK_TU)**

---

## What You'll Build

A private notes app where every user owns their data, AI runs server-side, and chat answers are grounded in your own notes — not the open internet.

**Notes**

- Create, edit, and delete notes with title + content
- One-click **✨ Summarize** — Gemini writes a short summary and 2–4 tags per note
- Summary and tags persist in Supabase and show on each card

**Auth & privacy**

- Email/password signup and login with Supabase Auth
- Router guard — unauthenticated users can't reach the notes page
- Row Level Security — every note is locked to its owner at the database level

**RAG chat**

- Ask questions in plain English ("What did I write about the design meeting?")
- Notes are embedded with `gemini-embedding-001` on save (768-dim vectors via pgvector)
- Cosine similarity search through a `match_notes` Postgres function, scoped to `auth.uid()`
- Streaming answers from `gemini-2.5-flash`, token by token, grounded only in matched notes

**Edge Functions (Deno)**

- `summarize-note` — structured JSON summary + tags from Gemini
- `embed-note` — turn note text into a vector (fire-and-forget on save)
- `chat-notes` — embed the question, search, stream the answer

The Gemini API key lives only in Supabase secrets — never in the browser.

---

## Stack

| Layer         | Tool                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| Frontend      | [Vue 3](https://vuejs.org) + [Vite](https://vite.dev) + TypeScript                      |
| Styling       | [Tailwind CSS v4](https://tailwindcss.com)                                              |
| Data fetching | [TanStack Vue Query](https://tanstack.com/query)                                        |
| Backend / DB  | [Supabase](https://supabase.com) — Postgres, Auth, Edge Functions                       |
| Vector search | [pgvector](https://github.com/pgvector/pgvector) extension                              |
| AI            | [Google Gemini API](https://ai.google.dev) — `gemini-2.5-flash`, `gemini-embedding-001` |
| CLI           | [Supabase CLI](https://supabase.com/docs/guides/cli) (dev dependency)                   |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/laribright/vue-js-note-ai
cd vue-js-note-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your Supabase values:

```bash
cp .env.example .env
```

See [Frontend environment variables](#frontend-environment-variables) below.

For local Edge Function testing, also copy:

```bash
cp supabase/functions/.env.example supabase/functions/.env
```

Add your Gemini API key there. See [Edge Function secrets](#edge-function-secrets).

### 4. Create a Supabase project

1. [supabase.com/dashboard](https://supabase.com/dashboard) → New project
2. Run the `notes` table SQL from **Episode 1** (or use the Table Editor)
3. Enable **Row Level Security** policies from **Episode 2**
4. Link the CLI:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
```

### 5. Enable pgvector + embeddings (Episode 4)

In the Supabase SQL Editor:

```sql
create extension if not exists vector;

alter table notes
add column if not exists embedding vector(768);

create index if not exists notes_embedding_idx
on notes using hnsw (embedding vector_cosine_ops);
```

Then create the similarity search function:

```sql
create or replace function match_notes(
  query_embedding vector(768),
  match_count int default 5,
  match_threshold float default 0.5
)
returns table (
  id uuid,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    notes.id,
    notes.title,
    notes.content,
    1 - (notes.embedding <=> query_embedding) as similarity
  from notes
  where notes.user_id = auth.uid()
    and notes.embedding is not null
    and 1 - (notes.embedding <=> query_embedding) > match_threshold
  order by notes.embedding <=> query_embedding
  limit match_count;
$$;
```

Regenerate TypeScript types:

```bash
npm run gen:types
```

### 6. Deploy Edge Functions + set secrets

Get a free Gemini key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (no credit card).

```bash
npx supabase secrets set GEMINI_API_KEY=your-gemini-api-key-here
npx supabase functions deploy summarize-note
npx supabase functions deploy embed-note
npx supabase functions deploy chat-notes
```

### 7. Start the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), sign up, and create a note with real content.

> **Local Edge Function testing:** `npx supabase functions serve --env-file supabase/functions/.env` — add `--no-verify-jwt` only for curl smoke tests without an auth token. The Vue app uses the **deployed** functions via your remote Supabase URL.

---

## Frontend environment variables

`.env`:

```bash
# Supabase — Dashboard → Settings → API
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key-here
```

> Use the **publishable key** (`sb_publishable_...`), not the secret key. Never put the Gemini key in `.env` — it belongs in Supabase secrets only.

---

## Edge Function secrets

**Production** — set once via CLI:

```bash
npx supabase secrets set GEMINI_API_KEY=your-gemini-api-key-here
```

**Local testing** — `supabase/functions/.env`:

```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

This file is gitignored. Copy from `supabase/functions/.env.example`.

---

## Project Structure

```
vue-js-note-ai/
├── supabase/
│   ├── config.toml
│   └── functions/
│       ├── _shared/
│       │   └── cors.ts              # Shared CORS headers
│       ├── summarize-note/
│       │   └── index.ts             # Gemini summary + tags (structured JSON)
│       ├── embed-note/
│       │   └── index.ts             # Gemini embeddings on save
│       └── chat-notes/
│           └── index.ts             # RAG search + streaming chat
├── src/
│   ├── components/
│   │   ├── NoteCard.vue             # Note display + Summarize button
│   │   ├── NoteForm.vue             # Create / edit form
│   │   └── ChatPanel.vue            # Streaming chat UI
│   ├── views/
│   │   ├── NotesView.vue            # Main app — notes + chat
│   │   ├── LoginView.vue
│   │   └── SignupView.vue
│   ├── composables/
│   │   ├── useAuth.ts               # Supabase Auth session
│   │   └── useChat.ts               # Streaming chat state
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client
│   │   ├── queryClient.ts           # TanStack Query setup
│   │   └── notes.ts                 # CRUD + summarize + background embed
│   ├── types/
│   │   ├── note.ts
│   │   └── chat.ts
│   ├── router/
│   │   └── index.ts                 # Auth guard
│   ├── database.types.ts            # Generated from Supabase schema
│   └── main.ts
├── .env.example
└── package.json
```

---

## Key Concepts Covered

- **Supabase Auth** — email/password signup, session persistence, sign out
- **Row Level Security** — Postgres enforces per-user note ownership
- **TanStack Vue Query** — cached notes list, mutations with invalidation
- **Edge Functions** — server-side Gemini calls, API key never in the browser
- **Structured JSON output** — `responseSchema` for reliable summary + tags parsing
- **pgvector + HNSW index** — fast cosine similarity search at 768 dimensions
- **Matryoshka embeddings** — truncate `gemini-embedding-001` to 768 dims for storage
- **RETRIEVAL_DOCUMENT vs RETRIEVAL_QUERY** — correct task types for embed vs search
- **RAG pipeline** — embed question → `match_notes` → prompt with context → stream answer
- **Raw fetch streaming** — bypass `functions.invoke()` buffering for token-by-token UI
- **Background embedding** — fire-and-forget after save so typing stays snappy

---

## Scripts

```bash
npm run dev          # Vite dev server (localhost:5173)
npm run build        # Type-check + production build
npm run preview      # Preview production build
npm run gen:types    # Regenerate src/database.types.ts from Supabase
npm run lint         # ESLint + Oxlint
npm run format       # Prettier

# Supabase CLI (via npx)
npx supabase login
npx supabase link --project-ref <ref>
npx supabase functions deploy <name>
npx supabase functions serve --env-file supabase/functions/.env
npx supabase secrets set GEMINI_API_KEY=...
```

---

## Course Episodes

| #   | Topic                                                     |
| --- | --------------------------------------------------------- |
| 1   | Notes CRUD + Supabase setup + generated types             |
| 2   | Auth, router guard, Row Level Security                    |
| 3   | AI summarize + auto-tag via Gemini Edge Function          |
| 4   | RAG chat — pgvector similarity search + streaming answers |
| 5   | Polish & deploy                                           |

📺 [Watch on YouTube](https://youtu.be/T5JsvgvK_TU)  
⭐ If this helped you, please star the repo — it helps a lot!

---

Built with [Vue](https://vuejs.org) · [Supabase](https://supabase.com) · [Gemini](https://ai.google.dev) · [CodeWithLari](https://youtube.com/@codewithlari)
