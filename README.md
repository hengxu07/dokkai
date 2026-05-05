# Dokkai 📖
> AI-powered Japanese reading assistant API

Dokkai helps Japanese learners analyze reading materials by extracting vocabulary, identifying grammar patterns, assessing JLPT difficulty levels, and generating quizzes — all powered by Claude AI.

## Features
- 📚 **Vocabulary Extraction** — Extract key words with readings (furigana) and English meanings
- 🔍 **Grammar Analysis** — Identify grammar patterns with explanations and examples
- 📊 **JLPT Level Assessment** — Automatically assess difficulty from N5 to N1
- ✅ **Quiz Generation** — Generate multiple choice questions with smart caching

## Tech Stack
- **FastAPI** — REST API framework
- **Claude AI** — Anthropic's AI for language analysis
- **ChromaDB** — Vector database for semantic search
- **SQLite** — Quiz caching and document storage
- **Railway** — Cloud deployment

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/{doc_id}` | Upload Japanese PDF or text file |
| GET | `/vocabulary/{doc_id}` | Extract vocabulary list |
| GET | `/grammar/{doc_id}` | Analyze grammar patterns |
| GET | `/level/{doc_id}` | Assess JLPT difficulty level |
| POST | `/quiz/{doc_id}` | Generate or retrieve quiz questions |

## Live Demo
API docs: [https://web-production-09a51.up.railway.app/docs](https://web-production-09a51.up.railway.app/docs)

## Local Setup
```bash
git clone https://github.com/hengxu07/dokkai.git
cd dokkai
pip install -r requirements.txt
export ANTHROPIC_API_KEY="your-api-key"
uvicorn api:app --reload
```