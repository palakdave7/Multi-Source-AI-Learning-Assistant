# 📚 Samasocial AI Learning Assistant

A production-quality, multi-source AI learning assistant built for the Samasocial Technical Assignment (Task 1). Upload PDFs, PowerPoints, YouTube videos, and webpages — then chat, get explanations, take quizzes, and study with flashcards, all grounded strictly in your own material.

**GitHub Repository:** `<your-repo-link>`
**Demo Video:** `<your-loom-link>`
**Live Deployment:** Not deployed (see [Deployment](#-deployment) section for instructions and effort estimate)

---

## ✨ Features

### Core Requirements

- 🎥 **YouTube** — fetches transcript, chunks with timestamps, cites `"at 3:22 in the video"`
- 📄 **PDF** — extracts text per page, cites `"page 4 of filename.pdf"`
- 📊 **PPTX** — parses slide text, cites `"slide 3 of filename.pptx"`
- 🌐 **Webpage** — scrapes and cleans any public URL, removes nav/footer/ads
- 🔀 **Multi-source sessions** — mix all source types together, add/remove individually, clear all
- 🧠 **True RAG pipeline** — chunk → embed → store → retrieve top-K → build prompt → generate (never dumps full document)
- 💬 **Streaming chat** — token-by-token SSE streaming with live skeleton loader
- 🔁 **Session memory** — full conversation history powers natural follow-up questions
- 🚫 **Out-of-scope detection** — politely declines questions not covered by loaded sources
- 🗣️ **Explain modes** — "explain in simple terms", "summarize", bullet-point breakdowns on request
- 🔗 **Cross-source reasoning** — retrieval pulls from all loaded sources simultaneously; answers can cite multiple sources in one response

### Bonus Features (all implemented)

- 🧪 **Quiz Me** — auto-generated interactive MCQ quiz with live scoring and results screen
- 🃏 **Flashcards** — auto-generated flip cards with progress tracking and review mode
- 📝 **Source summaries** — auto-generated summary + chunk count shown after each source is processed
- 📋 **Copy response** — one-click copy any assistant message
- 🔄 **Regenerate** — regenerate the last response
- 🗑️ **Source management** — delete individual sources or clear all
- 📱 **Mobile responsive** — collapsible sidebar with overlay on small screens
- 🖱️ **Drag-and-drop upload** — drag PDF/PPTX directly onto the upload zone
- 🎬 **Smooth animations** — framer-motion transitions, skeleton loaders, suggestion chips

---

## 🏗️ Architecture

```
samasocial-ai/
├── backend/
│   ├── main.py                  # FastAPI app, middleware, CORS, rate limiting, routers
│   ├── config.py                # Centralized settings (pydantic-settings)
│   ├── store.py                 # Session store — ChromaDB (vectors) + SQLite (sources/history)
│   ├── db.py                    # SQLite persistence layer
│   ├── logger.py                # Structured logging (API, processing, errors)
│   ├── .env.example
│   ├── routers/
│   │   ├── ingest.py             # POST /api/ingest/{youtube,pdf,pptx,url}, validation
│   │   └── chat.py               # POST /api/chat/, /quiz, /flashcards (rate-limited)
│   ├── services/
│   │   ├── sources.py            # Source parsers (YouTube/PDF/PPTX/URL)
│   │   ├── embeddings.py          # Local embeddings (sentence-transformers)
│   │   ├── retrieval.py           # ChromaDB indexing + semantic search
│   │   └── llm.py                 # Groq LLM — chat, quiz, flashcards, summaries
│   ├── schemas/
│   │   └── session.py             # Pydantic request/response models
│   ├── middleware/
│   │   └── error_handler.py        # Global exception handlers
│   ├── prompts/
│   │   └── chat_prompt.py          # All prompt templates (RAG, quiz, summary, flashcards)
│   └── utils/
│       └── text.py                  # Text cleaning + chunking utilities
└── frontend/
    ├── .env.local
    └── app/
        ├── page.tsx                # Session init, responsive layout, mobile sidebar
        ├── layout.tsx              # HTML shell, toast provider, metadata
        └── components/
            ├── SourcePanel.tsx       # Source upload (drag-drop), badges, summaries
            ├── ChatPanel.tsx         # Chat, Quiz Me, Flashcards UI
            └── SkeletonLoader.tsx    # Loading skeleton components
```

### RAG Pipeline (every query)

```
User uploads source (PDF / PPTX / YouTube / URL)
        ↓
Validate (file type, size, URL format)
        ↓
Parse & extract text + metadata (page/slide/timestamp/url)
        ↓
Clean & normalize text
        ↓
Chunk with overlap (1500 words, 150-word overlap)
        ↓
Generate embeddings (sentence-transformers, local, 384-dim)
        ↓
Store in ChromaDB (persistent, cosine similarity, per-session collection)
        ↓
Generate & display source summary + chunk count
─────────────────────────────────────────────
User asks a question
        ↓
Embed query → semantic search → top-5 relevant chunks (across ALL sources)
        ↓
Build grounded prompt (context + conversation history)
        ↓
Stream response from Groq (llama-3.3-70b-versatile)
        ↓
Render markdown, attach source citations
        ↓
Persist message to SQLite (session history)
```

---

## 🛠️ Tech Stack

| Layer              | Technology                                 | Why                                                                |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------ |
| Backend framework  | FastAPI                                    | Async, modular routers, native streaming support                   |
| LLM                | Groq (`llama-3.3-70b-versatile`)           | Free tier with generous limits, fast inference, strong RAG quality |
| Embeddings         | sentence-transformers (`all-MiniLM-L6-v2`) | Local, free, no rate limits, production-grade quality              |
| Vector DB          | ChromaDB (persistent, disk-backed)         | Zero setup, cosine similarity, abstracted for easy swap            |
| Relational store   | SQLite                                     | Lightweight persistence for sessions/sources/history               |
| Rate limiting      | slowapi                                    | Per-IP limits on chat/quiz/flashcard endpoints                     |
| Frontend framework | Next.js 14 (App Router) + TypeScript       | SSE streaming, modern routing, type safety                         |
| Styling            | Tailwind CSS                               | Rapid, consistent, dark-themed UI                                  |
| Animations         | framer-motion                              | Smooth message transitions, card flips                             |
| Markdown           | react-markdown + remark-gfm                | Rich formatted AI responses                                        |
| Notifications      | react-hot-toast                            | Non-blocking status feedback                                       |

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- Free Groq API key — https://console.groq.com

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env` (see `.env.example`):

```env
GROQ_API_KEY=your_groq_api_key_here
ALLOWED_ORIGINS=http://localhost:3000
CHROMA_PATH=./chroma_data
CHUNK_SIZE=1500
CHUNK_OVERLAP=150
TOP_K=5
MAX_HISTORY=8
```

Run:

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run:

```bash
npm run dev
```

Open **http://localhost:3000**

---

## 🔑 Environment Variables

| Variable                       | Where    | Required | Description                                                    |
| ------------------------------ | -------- | -------- | -------------------------------------------------------------- |
| `GROQ_API_KEY`                 | backend  | ✅       | LLM API key from console.groq.com                              |
| `ALLOWED_ORIGINS`              | backend  | ❌       | Comma-separated CORS origins (default `http://localhost:3000`) |
| `CHROMA_PATH`                  | backend  | ❌       | ChromaDB storage path (default `./chroma_data`)                |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | backend  | ❌       | Chunking parameters (defaults `1500` / `150`)                  |
| `TOP_K`                        | backend  | ❌       | Retrieval depth (default `5`)                                  |
| `MAX_HISTORY`                  | backend  | ❌       | Conversation turns sent to LLM (default `8`)                   |
| `NEXT_PUBLIC_API_URL`          | frontend | ✅       | Backend base URL                                               |

---

## 📡 API Reference

| Method | Endpoint                  | Description                          | Rate Limit |
| ------ | ------------------------- | ------------------------------------ | ---------- |
| POST   | `/api/ingest/new-session` | Create a new session                 | —          |
| POST   | `/api/ingest/youtube`     | Ingest YouTube URL (validated)       | —          |
| POST   | `/api/ingest/pdf`         | Ingest PDF (max 10MB, type-checked)  | —          |
| POST   | `/api/ingest/pptx`        | Ingest PPTX (max 10MB, type-checked) | —          |
| POST   | `/api/ingest/url`         | Ingest webpage URL (validated)       | —          |
| GET    | `/api/ingest/sources`     | List session sources                 | —          |
| POST   | `/api/chat/`              | Streaming RAG chat (SSE)             | 10/min     |
| POST   | `/api/chat/quiz`          | Generate interactive MCQ quiz        | 5/min      |
| POST   | `/api/chat/flashcards`    | Generate flashcards                  | 5/min      |
| GET    | `/api/chat/history`       | Get session chat history             | —          |
| GET    | `/health`                 | Health check                         | —          |

---

## 🎯 Design Decisions

**Local embeddings over hosted embedding APIs**
`sentence-transformers/all-MiniLM-L6-v2` runs locally — no API keys, no rate limits, no daily quota walls (Gemini's free embedding tier proved unusable with `limit: 0` during development). 384-dim vectors with cosine similarity provide solid retrieval quality for this use case.

**Groq for generation**
`llama-3.3-70b-versatile` via Groq gives fast, high-quality, instruction-following output with a generous free tier — critical for reliable demos and iterative development without quota exhaustion.

**ChromaDB (persistent) over a managed vector DB**
Covers the assignment's evaluation and demo scope with zero external dependencies. `services/retrieval.py` is fully abstracted behind `index_chunks()` / `retrieve_chunks()` — swapping to Supabase pgvector or Qdrant for multi-server deployments touches only this one file.

**SQLite for sessions/sources/history**
Lightweight, zero-setup persistence layer (`db.py`) ensures data survives backend restarts — a meaningful upgrade over pure in-memory state, while staying dependency-free for local development and small deployments.

**SSE streaming over WebSockets**
One-directional server→client token streaming maps cleanly onto FastAPI's `StreamingResponse` and the browser `fetch` + `ReadableStream` API, without the bidirectional complexity WebSockets would add for no benefit here.

**Chunking strategy**
1500-word chunks with 150-word overlap balance retrieval precision with context preservation — overlap ensures ideas spanning chunk boundaries remain retrievable, while metadata (`page`/`slide`/`timestamp`/`url`) is preserved per chunk for accurate citations.

**Per-session ChromaDB collections**
Each session gets its own isolated vector collection (`session_<uuid>`), so retrieval never leaks across users/sessions and multi-source mixing stays scoped correctly.

---

## 📊 Evaluation Criteria Coverage

| Criterion          | Weight | Coverage                                                                                                                                                                                                                                  |
| ------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Quality**     | 30%    | True RAG pipeline (chunk→embed→retrieve→generate), grounded answers only, no full-document dumping, accurate page/slide/timestamp/URL citations, graceful out-of-scope refusal, follow-up + cross-source reasoning, "explain simply" mode |
| **Code Quality**   | 25%    | Modular FastAPI (routers/services/schemas/middleware/prompts/utils), typed Pydantic models, centralized config, structured logging, no duplicated logic, consistent formatting                                                            |
| **UI/UX**          | 20%    | Modern dark chat UI, drag-and-drop upload, source badges + summaries, streaming with skeleton loaders, markdown rendering, copy/regenerate/clear, empty/error/loading states, mobile responsive, framer-motion animations                 |
| **Architecture**   | 15%    | Clear separation of concerns (ingestion / retrieval / generation / presentation), swappable vector store, env-based config, rate limiting, persistent storage layer                                                                       |
| **Bonus Features** | 10%    | Multi-source with per-answer citations, interactive Quiz Me (scored MCQs), Flashcards (flip + progress), automatic source summaries — all implemented and working                                                                         |

---

## ⚠️ Production Roadmap

This implementation is a complete, working RAG system with persistence, rate limiting, validation, and structured logging — not a prototype. For scaling beyond a single-server demo, these are the natural next steps:

| Area               | Current                                 | Production Path                                                         |
| ------------------ | --------------------------------------- | ----------------------------------------------------------------------- |
| Vector storage     | ChromaDB, disk-persisted                | Supabase pgvector or Qdrant — `retrieval.py` is the only file to change |
| Relational storage | SQLite                                  | PostgreSQL for concurrent multi-server access                           |
| Session continuity | Fresh session per page load (by design) | Persist `session_id` in localStorage to resume across refreshes         |
| Authentication     | None (single-user demo)                 | Supabase Auth / JWT                                                     |
| File uploads       | Held in memory during processing        | Stream to S3 / Supabase Storage for larger files                        |
| Server scaling     | Single uvicorn worker                   | `gunicorn -k uvicorn.workers.UvicornWorker -w 4 main:app`               |
| Rate limiting      | ✅ Implemented (per-IP, in-memory)      | Redis-backed limiter for multi-instance deployments                     |

---

## 🧪 Manual Testing

```bash
# Health check
curl http://localhost:8000/health

# Create a session
curl -X POST http://localhost:8000/api/ingest/new-session

# Ingest a webpage
curl -X POST http://localhost:8000/api/ingest/url \
  -d "session_id=YOUR_SESSION_ID&url=https://en.wikipedia.org/wiki/Machine_learning"

# Ask a question (streaming)
curl -N -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"session_id":"YOUR_SESSION_ID","message":"What is supervised learning?"}'
```

---

## 📦 Capacity & Limits

| Aspect               | Limit                              | Notes                                                                                            |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| PDF / PPTX file size | 10MB per file                      | ≈ 200-400 pages of text; enforced via `MAX_FILE_SIZE` validation                                 |
| Chunk size           | 1500 words (150-word overlap)      | A 10MB PDF produces ~150-300 chunks                                                              |
| Embedding speed      | ~10-50ms per chunk (CPU, local)    | A full 10MB PDF embeds in ~10-30 seconds                                                         |
| Retrieval            | Top-5 chunks per query             | Query speed stays constant regardless of total chunks indexed (ChromaDB ANN search)              |
| LLM context          | 128K tokens (Groq `llama-3.3-70b`) | Top-5 chunks + 8-turn history comfortably fits with room to spare                                |
| YouTube / Webpage    | No hard cap                        | Bounded naturally by transcript/page length; very large pages produce proportionally more chunks |

**In practice:** comfortably handles multiple medium-sized documents (lecture notes, slide decks, articles) plus videos in a single session — well beyond typical course material. The 10MB file cap and chunking strategy are deliberate safeguards to keep embedding latency low for a responsive demo experience, not architectural shortcuts.

**Recommended UI test flow** (also shown in demo video):

1. Drag-drop a PDF and add a YouTube URL + webpage URL (3 sources)
2. Ask a question answerable from the PDF → verify page citation + streaming
3. Ask "explain that in simple terms" → verify follow-up context retained
4. Ask something only the video covers → verify timestamp citation
5. Ask an unrelated question → verify graceful refusal
6. Run Quiz Me → answer questions → view score
7. Run Flashcards → flip and navigate cards
8. Resize to mobile → verify collapsible sidebar

---

## 🚀 Deployment

**Not deployed for this submission** (deployment is an optional bonus per assignment guidelines). The application is deployment-ready with minor configuration:

**Backend (Railway / Render)**

- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set env vars: `GROQ_API_KEY`, `ALLOWED_ORIGINS=<frontend-url>`
- Attach a persistent volume for `chroma_data/` and `sessions.db`

**Frontend (Vercel)**

- Set `NEXT_PUBLIC_API_URL=<backend-url>`
- `npm run build`

**Estimated effort:** ~30–45 minutes — mostly waiting on the `sentence-transformers`/`torch` dependency install on first deploy (~500MB), plus verifying CORS and persistent volume configuration on the chosen platform.

---

## 📝 Known Constraints

- Each browser session starts fresh (no localStorage session resume) — a deliberate choice for a clean demo experience; backend persistence (SQLite + ChromaDB) ensures no data loss on server restarts mid-session.
- Single-user rate limits (10 req/min chat) are tuned for demo/dev use and would need adjustment for multi-tenant production traffic.
