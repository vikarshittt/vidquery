# IP-III Project TODO - Backend RAG App

## Status: Environment Setup [✅]

### 1. Setup Environment [✅]
- Create/activate venv
- pip install -r Project/AI_Backend/requirements.txt

### 2. Configure .env [✅]
- GROQ_API_KEY provided

### 3. Test Backend [✅ LIVE + MULTILINGUAL + SESSION MGMT]

- New: get_youtube_transcript_multilingual + API languages param
- Cache + fallbacks
- Server reloaded OK
- Server: http://localhost:8000/docs
- Test video_id="y122nhdFMkI"
- cd Project/AI_Backend
- python main.py (or uvicorn main:app --reload)
- Visit http://localhost:8000/docs
- POST /api/chat with video_id + query

### 4. Test Integration (Pending)
- Run frontend
- Test end-to-end Q&A

### 5. Deploy (Optional)
- Vercel backend?
