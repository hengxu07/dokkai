# Dokkai — Architecture

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React (Create React App) | Hosted on Vercel |
| Backend | FastAPI (Python) | Hosted on Railway |
| AI | Claude API (claude-sonnet-4-5) | Vocabulary, grammar, JLPT, quiz, kanji |
| Database | SQLite | Users, documents, quiz cache |
| Auth | JWT + bcrypt | 24-hour tokens |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│                                                             │
│   React (Create React App)  — Vercel                        │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  /login  /register       — Auth pages               │   │
│   │  /dashboard              — Upload, analyze, quiz    │   │
│   └───────────────────────┬─────────────────────────────┘   │
│                           │ HTTPS + Bearer JWT              │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  FastAPI Backend  — Railway                  │
│                                                             │
│  Auth routes                                                │
│    POST /register  POST /login                              │
│                                                             │
│  Document routes  (all require JWT)                         │
│    POST /upload/{doc_id}   — PDF/text → extracted text      │
│    GET  /vocabulary/{doc_id}                                │
│    GET  /grammar/{doc_id}                                   │
│    GET  /level/{doc_id}                                     │
│    GET  /kanji/{doc_id}                                     │
│    POST /quiz/{doc_id}     — cache hit or generate          │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────┐ │
│  │  auth.py │   │  database.py │   │       ai.py          │ │
│  │  JWT     │   │  SQLite ORM  │   │  Claude API calls    │ │
│  │  bcrypt  │   │  (sync)      │   │  JSON parsing        │ │
│  └──────────┘   └──────────────┘   └──────────┬──────────┘ │
└────────────────────────┬────────────────────────┼───────────┘
                         │                        │
          ┌──────────────▼────────┐    ┌──────────▼────────────┐
          │       SQLite          │    │    Claude API          │
          │                       │    │  (claude-sonnet-4-5)   │
          │  users                │    │                        │
          │  documents            │    │  extract_vocabulary()  │
          │    └─ content (text)  │    │  analyze_grammar()     │
          │    └─ level (JLPT)    │    │  assess_jlpt_level()   │
          │  quizzes (cached)     │    │  generate_quiz()       │
          └───────────────────────┘    │  analyze_kanji()       │
                                       └────────────────────────┘
```

---

## Data Flow

### Auth
1. User registers or logs in → server hashes password with bcrypt, returns a 24-hour JWT
2. All subsequent requests include `Authorization: Bearer <token>` → `get_current_user()` decodes the JWT and injects `user_id`

### Document Upload
1. Client POSTs a PDF or `.txt` file to `/upload/{doc_id}`
2. PDFs are extracted via `pypdf`; text files are UTF-8 decoded
3. Raw text is stored in `documents(doc_id, user_id, content)`

### Analysis (Vocabulary / Grammar / Level / Kanji)
1. Endpoint fetches stored text from SQLite by `(doc_id, user_id)`
2. Text is sent directly to Claude in a structured prompt requesting a JSON response
3. Response is stripped of markdown fences, parsed, and returned

### Quiz (with caching)
1. `/quiz/{doc_id}` checks SQLite for existing questions first
2. Cache hit → returns stored questions immediately
3. Cache miss → calls Claude, saves generated questions, returns them

---

## Design Notes

- **SQLite over Postgres** — single-server Railway deploy; file-based DB is sufficient
- **Synchronous Claude calls** — all `messages.create()` calls are blocking; responses are short structured JSON so streaming is not needed
- **Quiz caching** — avoids redundant Claude calls for the same document
- **No ChromaDB** — listed in the README but not implemented in the codebase
