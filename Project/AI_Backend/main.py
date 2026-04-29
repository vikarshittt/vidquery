import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from youtube_transcript_api._errors import NotTranslatable
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from typing import List, Optional
from functools import lru_cache
from datetime import datetime

# ---------------- ENV ----------------
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise EnvironmentError("GROQ_API_KEY not found in .env file")

# ---------------- APP ----------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- CACHE ----------------
chain_cache = {}
sessions = {}

# ---------------- MODELS ----------------
class ChatRequest(BaseModel):
    video_id: str
    query: str
    languages: List[str] = ['en', 'es', 'fr', 'de']
    session_id: Optional[str] = None

# ---------------- SESSION ----------------
class ChatSession:
    def __init__(self):
        self.history = []

    def add_interaction(self, q, a):
        self.history.append({"q": q, "a": a, "t": datetime.now()})
        if len(self.history) > 10:
            self.history = self.history[-10:]

    def get_context(self):
        return "\n".join([f"Q:{i['q']} A:{i['a']}" for i in self.history[-3:]])

    def clear(self):
        self.history = []

# ---------------- TRANSCRIPT ----------------
def get_youtube_transcript_multilingual(video_id: str, langs: List[str]):
    api = YouTubeTranscriptApi()

    # Try direct languages
    for lang in langs:
        try:
            data = api.fetch(video_id, languages=[lang])
            return " ".join([d.text for d in data])
        except:
            continue

    # Fallback translate
    try:
        t_list = api.list(video_id)
        for t in t_list:
            if t.is_generated:
                translated = t.translate(langs[0]).fetch()
                return " ".join([d['text'] for d in translated])
    except:
        return None

    return None

# ---------------- RAG ----------------
def create_rag_chain(video_id: str, langs: List[str]):
    transcript = get_youtube_transcript_multilingual(video_id, langs)
    if not transcript:
        return None

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_text(transcript)

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vector = FAISS.from_texts(chunks, embeddings)
    retriever = vector.as_retriever()

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        groq_api_key=GROQ_API_KEY
    )

    prompt = PromptTemplate.from_template("""
    Answer based only on context.

    CONTEXT:
    {context}

    QUESTION:
    {question}
    """)

    def format_docs(docs):
        return "\n\n".join(d.page_content for d in docs)

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain

# ---------------- ROUTES ----------------
@app.post("/api/chat")
async def chat(req: ChatRequest):
    vid = req.video_id

    # session
    if req.session_id:
        if req.session_id not in sessions:
            sessions[req.session_id] = ChatSession()
        session = sessions[req.session_id]
    else:
        session = None

    # chain cache
    if vid in chain_cache:
        chain = chain_cache[vid]
    else:
        chain = create_rag_chain(vid, req.languages)
        if not chain:
            raise HTTPException(500, "Transcript not available")
        chain_cache[vid] = chain

    # context injection
    query = req.query
    if session:
        query = session.get_context() + "\n" + query

    answer = chain.invoke(query)

    if session:
        session.add_interaction(req.query, answer)

    return {"answer": answer}

@app.post("/api/clear-session/{session_id}")
async def clear_session(session_id: str):
    if session_id in sessions:
        sessions[session_id].clear()
        return {"message": "cleared"}
    return {"message": "not found"}

#         prompt = PromptTemplate.from_template(prompt_template)
#         def format_docs(docs):
#             return "\n\n---\n\n".join(doc.page_content for doc in docs)
#         rag_chain = (
#             {"context": retriever | format_docs, "question": RunnablePassthrough()}
#             | prompt
#             | llm
#             | StrOutputParser()
#         )
#         print("RAG chain created successfully.")
#         return rag_chain
#     except Exception as e:
#         print(f"An error occurred during RAG chain creation: {e}")
#         return None


#     import uvicorn
#     print("Starting FastAPI server on http://localhost:8000")
#     uvicorn.run(app, host="0.0.0.0", port=8000)






def get_youtube_transcript(video_id: str) -> str | None:
    print(f"[DEBUG] Entering get_youtube_transcript with video_id: {video_id}")
    api = YouTubeTranscriptApi()
    
    try:
        print("[DEBUG] Attempting to fetch direct English transcript...")
        transcript_snippets = api.fetch(video_id, languages=['en'])
        transcript_text = " ".join(snippet.text for snippet in transcript_snippets)
        print("[DEBUG] Direct English transcript fetched successfully.")
        return transcript_text
    except NoTranscriptFound as e:
        print(f"[DEBUG] Direct English transcript not found: {e}. Attempting translation or fallback...")
        try:
            transcript_list = api.list(video_id)
            available_langs = [t.language_code for t in transcript_list if t.language_code]
            if not available_langs:
                print("[DEBUG] No transcripts available in any language.")
                return None

            print(f"[DEBUG] Available language codes: {available_langs}")
            transcript_to_translate = transcript_list.find_transcript(available_langs)
            print(f"[DEBUG] Selected transcript in '{transcript_to_translate.language}' to translate.")
            print("[DEBUG] Translating transcript to English...")
            try:
                translated_snippets = transcript_to_translate.translate('en').fetch()
                transcript_text = " ".join(snippet.text for snippet in translated_snippets)
                print("[DEBUG] Transcript translated to English successfully.")
                return transcript_text
            except NotTranslatable as e_trans:
                print(f"[WARN] Translation not available: {e_trans}. Falling back to raw transcript.")
            except Exception as e_trans:
                print(f"[ERROR] Error during translation attempt: {e_trans}. Falling back to raw transcript.")

            print("[DEBUG] Fetching raw transcript in original language...")
            raw_snippets = transcript_to_translate.fetch()
            transcript_text = " ".join(snippet.text for snippet in raw_snippets)
            print("[DEBUG] Raw transcript fetched successfully.")
            return transcript_text
        except TranscriptsDisabled:
            print(f"[DEBUG] Transcripts are disabled for video (translation attempt): {video_id}")
            return None
        except Exception as e_trans:
            print(f"[ERROR] Error during translation attempt: {e_trans}")
            return None
    except TranscriptsDisabled:
        print(f"[DEBUG] Transcripts are disabled for video (initial fetch): {video_id}")
        return None
    except Exception as e_main:
        print(f"[ERROR] Unexpected error in get_youtube_transcript: {e_main}")
        return None

def get_youtube_transcript_multilingual(
    video_id: str,
    preferred_languages: List[str] = ['en', 'es', 'fr', 'de']
) -> dict:
    print(f"[DEBUG] Fetching multilingual transcript for {video_id}, prefs: {preferred_languages}")
    api = YouTubeTranscriptApi()

    # Step 1: Try preferred languages directly
    for lang in preferred_languages:
        try:
            print(f"[DEBUG] Trying direct fetch for '{lang}'")
            transcript_snippets = api.fetch(video_id, languages=[lang])
            transcript_text = " ".join(snippet.text for snippet in transcript_snippets)
            print(f"[SUCCESS] Direct transcript in '{lang}'")
            return transcript_text
        except NoTranscriptFound:
            print(f"[DEBUG] No transcript in '{lang}'")
            continue
        except Exception as e:
            print(f"[DEBUG] Error fetching '{lang}': {e}")
            continue

    # Step 2: Fallback translation
    try:
        print("[DEBUG] Fallback to any available + translate...")
        transcript_list = api.list_transcripts(video_id)
        if not transcript_list:
            return None

        # Prefer generated for translate
        for transcript in transcript_list:
            try:
                if transcript.is_generated:
                    print("[DEBUG] Using generated transcript for translation")
                    target_lang = preferred_languages[0]
                    translated = transcript.translate(target_lang)
                    transcript_text = " ".join(entry['text'] for entry in translated.fetch())
                    print(f"[SUCCESS] Translated to '{target_lang}'")
                    return transcript_text
            except Exception:
                continue
        # If no generated, take first manual
        transcript = transcript_list.find_manually_created_transcript([])
        if transcript:
            print("[DEBUG] Using manual transcript")
            snippets = transcript.fetch()
            return " ".join(snippet['text'] for snippet in snippets)
    except TranscriptsDisabled:
        print("[ERROR] Transcripts disabled")
        return None
    except Exception as e:
        print(f"[ERROR] Fallback failed: {e}")
        return None

    print("[DEBUG] No transcript available")
    return None


@lru_cache(maxsize=50)
def get_youtube_transcript_multilingual_cached(video_id: str, preferred_languages_tuple: tuple):
    # Convert tuple back for func call
    preferred_languages = list(preferred_languages_tuple)
    return get_youtube_transcript_multilingual(video_id, preferred_languages)


def create_rag_chain(video_id: str, preferred_languages: List[str] = ['en', 'es', 'fr', 'de']):
    print(f"[DEBUG] Entering create_rag_chain with video_id: {video_id}")
    transcript = get_youtube_transcript_multilingual(video_id, preferred_languages)
    if not transcript:
        print("[ERROR] Failed to build RAG chain: No transcript available.")
        return None

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    print("[DEBUG] Splitting transcript into chunks...")
    chunks = text_splitter.split_text(transcript)
    if not chunks:
        print("[ERROR] Failed to split transcript.")
        return None
    print(f"[DEBUG] Transcript split into {len(chunks)} chunks.")

    try:
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        print("[DEBUG] Creating vector store from chunks...")
        vector_store = FAISS.from_texts(chunks, embeddings)
        retriever = vector_store.as_retriever(search_kwargs={"k": 4})
        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=os.getenv("GROQ_API_KEY")
        )

        prompt_template = """
        You are a helpful YouTube assistant. Answer the user's question
        based *only* on the following transcript context.
        If the answer is not in the context, say so.

        CONTEXT:
        {context}

        QUESTION:
        {question}

        ANSWER:
        """
        prompt = PromptTemplate.from_template(prompt_template)
        def format_docs(docs):
            print(f"[DEBUG] Formatting {len(docs)} documents for chain input...")
            return "\n\n---\n\n".join(doc.page_content for doc in docs)
        
        rag_chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
        print("[DEBUG] RAG chain created successfully.")
        return rag_chain
    except Exception as e:
        print(f"[ERROR] Error during RAG chain creation: {e}")
        return None

def extract_timestamps(transcript_data):
    """Link answers to specific timestamps in the video"""
    timestamps = []
    for entry in transcript_data:
        timestamps.append({
            "text": entry['text'],
            "start": entry['start'],
            "duration": entry['duration']
        })
    return timestamps

def create_timestamp_link(video_id: str, seconds: float) -> str:
    return f"https://youtu.be/{video_id}?t={int(seconds)}"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://youtuber-video-rag-project.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    video_id: str
    query: str
    languages: List[str] = ['en', 'es', 'fr', 'de']
    session_id: Optional[str] = None

class ChatSession:
    def __init__(self):
        self.history = []

    def add_interaction(self, question: str, answer: str):
        self.history.append({
            "question": question,
            "answer": answer,
            "timestamp": datetime.now()
        })
        if len(self.history) > 10:
            self.history = self.history[-10:]

    def get_context_window(self, last_n=3):
        context = ""
        for item in self.history[-last_n:]:
            context += f"Q: {item['question']}\\nA: {item['answer']}\\n"
        return context

    def clear_history(self):
        self.history = []

vector_store_cache = {}
sessions = {}

@app.post("/api/chat")
async def chat_with_video(request: ChatRequest):
    print(f"[DEBUG] Received chat request for video: {request.video_id}")
    chain = create_rag_chain(request.video_id, request.languages)
    if request.video_id in chain_cache:
        print("[DEBUG] Loading RAG chain from cache.")
        chain = chain_cache[request.video_id]
    else:
        print("[DEBUG] Building new RAG chain...")
        chain = create_rag_chain(request.video_id)
        if chain:
            print("[DEBUG] Storing new chain in cache.")
            chain_cache[request.video_id] = chain

    if not chain:
        print("[ERROR] RAG chain creation failed.")
        raise HTTPException(status_code=500, detail="Failed to create RAG chain. Check transcript availability.")

    try:
        print(f"[DEBUG] Invoking chain with query: '{request.query}'")
        answer = chain.invoke(request.query)
        print("[DEBUG] Chain invocation successful. Answer ready.")
        return {"answer": answer}
    except Exception as e:
        print(f"[ERROR] Error during chain invocation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("[DEBUG] Starting FastAPI server on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
