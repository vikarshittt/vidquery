# VidQuery - AI YouTube Chatbot (RAG)

Full-stack app: FastAPI backend (LangChain RAG + Groq/HF) + Next.js frontend.

Current: Groq Llama3 + local embeddings + multilingual transcripts.

## 📁 Structure
```
Project/
├── AI_Backend/     # Python FastAPI
│   ├── main.py
│   ├── requirements.txt
│   └── .env        # GROQ_API_KEY
├── Frontend/       # Next.js 15
└── TODO.md
```

## 🚀 Quick Start

### 1. Backend (Terminal 1)
```bash
cd Project/AI_Backend
# venv (reuse Project/myenv or .venv)
python -m venv venv
venv\\Scripts\\activate  # Windows
pip install -r requirements.txt
# .env: GROQ_API_KEY=your_key (console.groq.com/keys)
python main.py
```
- http://localhost:8000/docs (Swagger)

### 2. Frontend (Terminal 2)
```bash
cd Project/Frontend
npm install
npm run dev
```
- http://localhost:3000

### 3. Usage
- Frontend: Paste YT link → ask questions
- Backend test: POST /api/chat {video_id, query, languages:["en","es"]}

## 🧪 API Test
```bash
curl -X POST http://localhost:8000/api/chat \
-H "Content-Type: application/json" \
-d '{\"video_id\":\"y122nhdFMkI\",\"query\":\"summary\",\"languages\":[\"en\",\"es\"]}'
```

## 🔧 Troubleshooting
- **No GROQ_KEY**: Add to .env, restart server (error logged).
- **Transcript fail**: Multilingual fallback (EN>ES>FR>DE → translate/raw).
- **CORS**: Origins set for localhost:3000/Vercel.
- **Port 8000/3000 used**: kill proc or `lsof -i :8000` | kill.
- **Python 3.14 warning**: Langchain pydantic, ignore.
- **No deps**: pip list | grep fastapi

## 🚀 Deploy
- Backend: Render/Fly.io
- Frontend: Vercel (linked)

Server active: http://localhost:8000
