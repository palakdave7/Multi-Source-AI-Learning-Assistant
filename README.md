# 📚 Samasocial AI Learning Assistant

A production-quality, multi-source AI learning assistant built for the Samasocial Technical Assignment. Chat with your learning materials — YouTube videos, PDFs, PowerPoints, and webpages — all in one session.

**Live Demo:** _(recording link here)_  
**GitHub:** _(your repo link here)_

---

## ✨ Features

### Core

- 🎥 **YouTube** — fetches transcript with timestamps, answers cite `"at 3:22 in the video"`
- 📄 **PDF** — extracts text per page, cites `"page 4 of filename.pdf"`
- 📊 **PPTX** — parses slide text, cites `"slide 3 of filename.pptx"`
- 🌐 **Webpage** — scrapes and cleans any public URL
- 🔀 **Multi-source** — mix all source types in one session
- 💬 **Streaming chat** — token-by-token SSE streaming
- 🧠 **Session memory** — full conversation history for follow-up questions
- 🚫 **Out-of-scope detection** — politely refuses questions not in the material

### Bonus

- 🧪 **Quiz Me** — interactive MCQ quiz with scoring, answer reveal, and results screen
- 🃏 **Flashcards** — flip cards for self-study with progress tracking
- 📝 **Source summaries** — auto-generated summary shown after each source is processed
- 📋 **Copy response** — one-click copy any assistant message
- 🔄 **Regenerate** — regenerate the last response
- 🗑️ **Delete sources** — remove individual sources or clear all
- 📱 **Mobile responsive** — collapsible sidebar on mobile

---

## 🏗️ Architecture

```
samasocial-ai/
├── backend/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── config.py            # Centralized settings via pydantic-settings
│   ├── store.py             # In-memory session store + ChromaDB persistent client
│   ├── logger.py            # Structured logging
│   ├── routers/
│   │   ├── ingest.py        # POST /api/ingest/{youtube,pdf,pptx,url}
│   │   └── chat.py          # POST /api/chat/, /quiz, /flashcards
│   └── services/
│       ├── sources.py       # Parsers for each source type
│       ├── embeddings.py    # sentence-transformers embeddings (local)
│       ├── retrieval.py     # ChromaDB vector indexing + semantic search
│       └── llm.py           # Groq LLM — chat, quiz, flashcard, summary generation
└── frontend/
    ├── app/
    │   ├── page.tsx          # Root layout, session init, mobile sidebar
    │   ├── layout.tsx        # HTML shell, toast provider
    │   └── components/
    │       ├── SourcePanel.tsx  # Source upload UI, source badges
    │       └── ChatPanel.tsx    # Chat, quiz, flashcard UI
    └── .env.local
```

### RAG Pipeline

```
User uploads source
       ↓
Parse & extract text (sources.py)
       ↓
Chunk with overlap (1500 words, 150 overlap)
       ↓
Embed each chunk (sentence-transformers/all-MiniLM-L6-v2)
       ↓
Store in ChromaDB (persistent, cosine similarity)
       ↓
User asks question
       ↓
Embed query → semantic search → top-5 chunks
       ↓
Build prompt with context + conversation history
       ↓
Stream response from Groq (llama-3.3-70b-versatile)
       ↓
Render markdown + show source citations
```

---

## 🛠️ Tech Stack

| Layer      | Technology                    | Reason                                   |
| ---------- | ----------------------------- | ---------------------------------------- |
| Backend    | FastAPI                       | Async, fast, clean routers               |
| LLM        | Groq (llama-3.3-70b)          | Free, fast, high quality                 |
| Embeddings | sentence-transformers (local) | No API limits, no cost, production-ready |
| Vector DB  | ChromaDB (persistent)         | Zero setup, disk persistence, swappable  |
| Frontend   | Next.js 14 + TypeScript       | App router, SSE streaming support        |
| Styling    | Tailwind CSS                  | Rapid, consistent UI                     |
| Toasts     | react-hot-toast               | Clean notifications                      |
| Markdown   | react-markdown + remark-gfm   | Rich response rendering                  |

---

## ⚙️ Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Groq API key (free at https://console.groq.com)

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```
GROQ_API_KEY=your_groq_api_key_here
ALLOWED_ORIGINS=http://localhost:3000
```

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Open `http://localhost:3000`

---

## 🔑 Environment Variables

| Variable              | Required | Description                                   |
| --------------------- | -------- | --------------------------------------------- |
| `GROQ_API_KEY`        | ✅       | Groq API key from console.groq.com            |
| `ALLOWED_ORIGINS`     | ❌       | CORS origins (default: http://localhost:3000) |
| `NEXT_PUBLIC_API_URL` | ✅       | Backend URL (default: http://localhost:8000)  |

---

## 📡 API Overview

| Method | Endpoint                  | Description         |
| ------ | ------------------------- | ------------------- |
| POST   | `/api/ingest/new-session` | Create new session  |
| POST   | `/api/ingest/youtube`     | Ingest YouTube URL  |
| POST   | `/api/ingest/pdf`         | Ingest PDF file     |
| POST   | `/api/ingest/pptx`        | Ingest PPTX file    |
| POST   | `/api/ingest/url`         | Ingest webpage URL  |
| GET    | `/api/ingest/sources`     | Get session sources |
| POST   | `/api/chat/`              | Streaming chat      |
| POST   | `/api/chat/quiz`          | Generate MCQ quiz   |
| POST   | `/api/chat/flashcards`    | Generate flashcards |
| GET    | `/api/chat/history`       | Get chat history    |
| GET    | `/health`                 | Health check        |

---

## 🎯 Design Decisions

**Local embeddings over API embeddings**
Used `sentence-transformers/all-MiniLM-L6-v2` instead of Gemini/OpenAI embeddings. Gemini's free tier has a `limit: 0` daily quota in practice, making it unusable for demos. Local embeddings are instant, free, and production-quality (384-dim, cosine similarity).

**Groq over OpenAI/Gemini for LLM**
Groq's free tier has generous RPM limits and `llama-3.3-70b-versatile` produces excellent RAG responses. No daily quota exhaustion during development or demos.

**ChromaDB persistent over Supabase pgvector**
ChromaDB with disk persistence covers the demo and evaluation use case with zero setup. For true production scale (multiple servers, horizontal scaling), the `retrieval.py` service is fully abstracted — swapping to Supabase pgvector or Qdrant requires changing only that file.

**SSE streaming over WebSockets**
Server-Sent Events are simpler to implement for one-directional streaming (server → client) and work natively with FastAPI's `StreamingResponse`. WebSockets would add unnecessary complexity for this use case.

**Chunking strategy**
1500-word chunks with 150-word overlap preserves context across boundaries. Overlap ensures concepts that span chunk boundaries are still retrievable.

---

## ⚠️ Known Limitations & Production Improvements

| Current                                               | Production Fix                               |
| ----------------------------------------------------- | -------------------------------------------- |
| ChromaDB in-memory/disk (single server)               | Supabase pgvector or Qdrant for multi-server |
| Session data lost on server restart (sources/history) | Store sessions in PostgreSQL                 |
| No authentication                                     | Add Supabase Auth or JWT                     |
| No rate limiting                                      | Add slowapi middleware                       |
| File uploads held in memory                           | Stream to S3/Supabase Storage                |
| Single worker uvicorn                                 | Gunicorn with multiple workers               |

---

## 🧪 Testing

```bash
# Health check
curl http://localhost:8000/health

# Create session
curl -X POST http://localhost:8000/api/ingest/new-session

# Ingest URL
curl -X POST http://localhost:8000/api/ingest/url \
  -d "session_id=YOUR_SESSION_ID&url=https://en.wikipedia.org/wiki/Machine_learning"
```

---

## 🚀 Deployment

**Backend** — Deploy to Railway or Render:

- Set environment variables in dashboard
- Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`

**Frontend** — Deploy to Vercel:

- Set `NEXT_PUBLIC_API_URL` to your backend URL
- `npm run build && npm start`
