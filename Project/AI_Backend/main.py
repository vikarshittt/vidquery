# import os
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from dotenv import load_dotenv
# from pathlib import Path
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_groq import ChatGroq
# from langchain_community.vectorstores import FAISS
# from langchain_core.prompts import PromptTemplate
# from langchain_core.runnables import RunnablePassthrough
# from langchain_core.output_parsers import StrOutputParser
# from typing import List, Optional
# from datetime import datetime

# # ─── ENV ─────────────────────────────────────────────────────────────────────
# env_path = Path(__file__).resolve().parent / ".env"
# load_dotenv(dotenv_path=env_path)

# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# if not GROQ_API_KEY:
#     raise EnvironmentError("GROQ_API_KEY not found in .env file")

# # ─── APP (single instance) ───────────────────────────────────────────────────
# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ─── GLOBAL EXCEPTION HANDLER (ensures CORS headers on 500s) ─────────────────
# from fastapi import Request
# from fastapi.responses import JSONResponse

# @app.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     return JSONResponse(
#         status_code=500,
#         content={"detail": str(exc)},
#         headers={"Access-Control-Allow-Origin": "*"},
#     )

# @app.exception_handler(HTTPException)
# async def http_exception_handler(request: Request, exc: HTTPException):
#     return JSONResponse(
#         status_code=exc.status_code,
#         content={"detail": exc.detail},
#         headers={"Access-Control-Allow-Origin": "*"},
#     )

# # ─── AUTH & HISTORY ROUTERS ──────────────────────────────────────────────────
# from auth import router as auth_router, history_router
# app.include_router(auth_router)
# app.include_router(history_router)

# # ─── CACHE ───────────────────────────────────────────────────────────────────
# chain_cache: dict = {}
# sessions: dict = {}

# # ─── MODELS ──────────────────────────────────────────────────────────────────
# class ChatRequest(BaseModel):
#     video_id: str
#     query: str
#     languages: List[str] = ['en', 'es', 'fr', 'de']
#     session_id: Optional[str] = None

# # ─── SESSION ─────────────────────────────────────────────────────────────────
# class ChatSession:
#     def __init__(self):
#         self.history: list = []

#     def add_interaction(self, q: str, a: str):
#         self.history.append({"q": q, "a": a, "t": datetime.now()})
#         if len(self.history) > 10:
#             self.history = self.history[-10:]

#     def get_context(self) -> str:
#         return "\n".join([f"Q:{i['q']} A:{i['a']}" for i in self.history[-3:]])

#     def clear(self):
#         self.history = []

# # ─── TRANSCRIPT (via yt-dlp — no IP blocking) ────────────────────────────────
# def get_transcript(video_id: str, langs: List[str]) -> Optional[str]:
#     import yt_dlp
#     import json
#     import urllib.request

#     url = f"https://www.youtube.com/watch?v={video_id}"
#     ydl_opts = {
#         "skip_download": True,
#         "quiet": True,
#         "no_warnings": True,
#     }

#     try:
#         with yt_dlp.YoutubeDL(ydl_opts) as ydl:
#             info = ydl.extract_info(url, download=False)

#         # Build priority list: preferred langs first, then any available
#         preferred = langs + ["en", "en-orig"]
#         sources = [info.get("subtitles", {}), info.get("automatic_captions", {})]

#         for src in sources:
#             for lang in preferred:
#                 if lang not in src:
#                     continue
#                 formats = src[lang]
#                 # Prefer json3, then vtt, then any
#                 for ext in ["json3", "vtt", None]:
#                     for fmt in formats:
#                         if ext is None or fmt.get("ext") == ext:
#                             try:
#                                 raw = urllib.request.urlopen(fmt["url"]).read()
#                                 if fmt.get("ext") == "json3" or ext == "json3":
#                                     data = json.loads(raw)
#                                     texts = []
#                                     for event in data.get("events", []):
#                                         for seg in event.get("segs", []):
#                                             t = seg.get("utf8", "").strip()
#                                             if t and t != "\n":
#                                                 texts.append(t)
#                                     if texts:
#                                         return " ".join(texts)
#                                 else:
#                                     # VTT: strip tags and timestamps
#                                     import re
#                                     text = raw.decode("utf-8", errors="ignore")
#                                     text = re.sub(r"WEBVTT.*?\n\n", "", text, flags=re.DOTALL)
#                                     text = re.sub(r"\d{2}:\d{2}[\d:.,]+ --> [\d:.,]+.*?\n", "", text)
#                                     text = re.sub(r"<[^>]+>", "", text)
#                                     text = re.sub(r"\n+", " ", text).strip()
#                                     if text:
#                                         return text
#                             except Exception:
#                                 continue
#     except Exception as e:
#         print(f"[ERROR] yt-dlp transcript fetch failed: {e}")

#     return None

# # ─── RAG CHAIN ───────────────────────────────────────────────────────────────
# def create_rag_chain(video_id: str, langs: List[str] = ['en', 'es', 'fr', 'de']):
#     print(f"[DEBUG] Building RAG chain for {video_id}")
#     transcript = get_transcript(video_id, langs)

#     if not transcript:
#         print("[ERROR] No transcript available.")
#         return None

#     splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
#     chunks = splitter.split_text(transcript)
#     if not chunks:
#         return None
#     print(f"[DEBUG] {len(chunks)} chunks created.")

#     try:
#         embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
#         vector_store = FAISS.from_texts(chunks, embeddings)
#         retriever = vector_store.as_retriever(search_kwargs={"k": 4})

#         llm = ChatGroq(model="llama-3.1-8b-instant", groq_api_key=GROQ_API_KEY)

#         prompt = PromptTemplate.from_template("""
# You are a helpful YouTube assistant. Answer the user's question
# based *only* on the following transcript context.
# If the answer is not in the context, say so.

# CONTEXT:
# {context}

# QUESTION:
# {question}

# ANSWER:
# """)

#         def format_docs(docs):
#             return "\n\n---\n\n".join(doc.page_content for doc in docs)

#         chain = (
#             {"context": retriever | format_docs, "question": RunnablePassthrough()}
#             | prompt
#             | llm
#             | StrOutputParser()
#         )
#         print("[DEBUG] RAG chain ready.")
#         return chain
#     except Exception as e:
#         print(f"[ERROR] RAG chain creation failed: {e}")
#         return None

# # ─── ROUTES ──────────────────────────────────────────────────────────────────
# @app.post("/api/chat")
# async def chat(req: ChatRequest):
#     vid = req.video_id

#     # Session management
#     session: Optional[ChatSession] = None
#     if req.session_id:
#         if req.session_id not in sessions:
#             sessions[req.session_id] = ChatSession()
#         session = sessions[req.session_id]

#     # Chain cache
#     if vid not in chain_cache:
#         try:
#             chain = create_rag_chain(vid, req.languages)
#         except HTTPException:
#             raise  # already formatted with CORS header via handler
#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"Failed to process video: {str(e)}")

#         if not chain:
#             raise HTTPException(
#                 status_code=422,
#                 detail="No transcript found for this video. It may have captions disabled, be age-restricted, or unavailable in your region."
#             )
#         chain_cache[vid] = chain
#     chain = chain_cache[vid]

#     # Inject session context
#     query = req.query
#     if session and session.history:
#         query = session.get_context() + "\n" + query

#     try:
#         answer = chain.invoke(query)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"AI inference failed: {str(e)}")

#     if session:
#         session.add_interaction(req.query, answer)

#     return {"answer": answer}


# @app.post("/api/clear-session/{session_id}")
# async def clear_session(session_id: str):
#     if session_id in sessions:
#         sessions[session_id].clear()
#         return {"message": "cleared"}
#     return {"message": "not found"}


# # ─── ENTRY POINT ─────────────────────────────────────────────────────────────
# if __name__ == "__main__":
#     import uvicorn
#     print("[DEBUG] Starting FastAPI server on http://localhost:8000")
#     uvicorn.run(app, host="0.0.0.0", port=8000)



import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from typing import List, Optional
from datetime import datetime

# ─── ENV ─────────────────────────────────────────────────────────────────────
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise EnvironmentError("GROQ_API_KEY not found in .env file")

# ─── APP ─────────────────────────────────────────────────────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── EXCEPTION HANDLERS ──────────────────────────────────────────────────────
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={"Access-Control-Allow-Origin": "*"},
    )

# ─── AUTH ROUTES ─────────────────────────────────────────────────────────────
from auth import router as auth_router, history_router
app.include_router(auth_router)
app.include_router(history_router)

# ─── CACHE ───────────────────────────────────────────────────────────────────
chain_cache: dict = {}
sessions: dict = {}

# ─── MODELS ──────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    video_id: str
    query: str
    languages: List[str] = ['en', 'es', 'fr', 'de']
    session_id: Optional[str] = None

# ─── SESSION ─────────────────────────────────────────────────────────────────
class ChatSession:
    def __init__(self):
        self.history: list = []

    def add_interaction(self, q: str, a: str):
        self.history.append({"q": q, "a": a, "t": datetime.now()})
        if len(self.history) > 10:
            self.history = self.history[-10:]

    def get_context(self) -> str:
        return "\n".join([f"Q:{i['q']} A:{i['a']}" for i in self.history[-3:]])

    def clear(self):
        self.history = []

# ─── FIXED TRANSCRIPT FUNCTION ───────────────────────────────────────────────
def get_transcript(video_id: str, langs: List[str]) -> Optional[str]:
    # --- METHOD 1: youtube_transcript_api (FAST + RELIABLE) ---
    try:
        from youtube_transcript_api import YouTubeTranscriptApi

        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        text = " ".join([t["text"] for t in transcript])

        if text:
            print("[DEBUG] Transcript fetched via API")
            return text

    except Exception as e:
        print(f"[DEBUG] API method failed: {e}")

    # --- METHOD 2: yt-dlp fallback ---
    try:
        import yt_dlp
        import json
        import requests

        url = f"https://www.youtube.com/watch?v={video_id}"

        ydl_opts = {
            "skip_download": True,
            "quiet": True,
        }

        headers = {
            "User-Agent": "Mozilla/5.0",
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        sources = [info.get("subtitles", {}), info.get("automatic_captions", {})]

        for src in sources:
            for lang, formats in src.items():
                for fmt in formats:
                    try:
                        res = requests.get(fmt["url"], headers=headers, timeout=10)
                        if res.status_code != 200:
                            continue

                        if fmt.get("ext") == "json3":
                            data = json.loads(res.content)
                            texts = []

                            for event in data.get("events", []):
                                for seg in event.get("segs", []):
                                    t = seg.get("utf8", "").strip()
                                    if t:
                                        texts.append(t)

                            if texts:
                                print("[DEBUG] Transcript via yt-dlp JSON")
                                return " ".join(texts)

                    except Exception:
                        continue

    except Exception as e:
        print(f"[ERROR] yt-dlp failed: {e}")

    return None

# ─── RAG CHAIN ───────────────────────────────────────────────────────────────
def create_rag_chain(video_id: str, langs: List[str] = ['en', 'es', 'fr', 'de']):
    print(f"[DEBUG] Building RAG chain for {video_id}")
    transcript = get_transcript(video_id, langs)

    if not transcript:
        print("[ERROR] No transcript available.")
        return None

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_text(transcript)

    if not chunks:
        return None

    print(f"[DEBUG] {len(chunks)} chunks created.")

    try:
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        vector_store = FAISS.from_texts(chunks, embeddings)
        retriever = vector_store.as_retriever(search_kwargs={"k": 4})

        llm = ChatGroq(model="llama-3.1-8b-instant", groq_api_key=GROQ_API_KEY)

        prompt = PromptTemplate.from_template("""
You are a helpful YouTube assistant. Answer the user's question
based *only* on the following transcript context.
If the answer is not in the context, say so.

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:
""")

        def format_docs(docs):
            return "\n\n---\n\n".join(doc.page_content for doc in docs)

        chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )

        print("[DEBUG] RAG chain ready.")
        return chain

    except Exception as e:
        print(f"[ERROR] RAG chain creation failed: {e}")
        return None

# ─── ROUTES ──────────────────────────────────────────────────────────────────
@app.post("/api/chat")
async def chat(req: ChatRequest):
    vid = req.video_id

    session: Optional[ChatSession] = None
    if req.session_id:
        if req.session_id not in sessions:
            sessions[req.session_id] = ChatSession()
        session = sessions[req.session_id]

    if vid not in chain_cache:
        try:
            chain = create_rag_chain(vid, req.languages)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        if not chain:
            raise HTTPException(
                status_code=422,
                detail="No transcript found for this video."
            )

        chain_cache[vid] = chain

    chain = chain_cache[vid]

    query = req.query
    if session and session.history:
        query = session.get_context() + "\n" + query

    try:
        answer = chain.invoke(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if session:
        session.add_interaction(req.query, answer)

    return {"answer": answer}


@app.post("/api/clear-session/{session_id}")
async def clear_session(session_id: str):
    if session_id in sessions:
        sessions[session_id].clear()
        return {"message": "cleared"}
    return {"message": "not found"}


# ─── ENTRY POINT ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("[DEBUG] Starting server on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)