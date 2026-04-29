import os
import sys
import traceback
from dotenv import load_dotenv

load_dotenv()

try:
    from main import get_youtube_transcript
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_groq import ChatGroq
    from langchain_community.vectorstores import FAISS
    from langchain_core.prompts import PromptTemplate
    from langchain_core.runnables import RunnablePassthrough
    from langchain_core.output_parsers import StrOutputParser

    video_id = "dQw4w9WgXcQ"
    transcript = get_youtube_transcript(video_id)
    if not transcript:
        raise ValueError("No transcript")
        
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_text(transcript)
    
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    vector_store = FAISS.from_texts(chunks, embeddings)
    print("Success")
except Exception as e:
    with open("error_trace2.txt", "w", encoding="utf-8") as f:
        traceback.print_exc(file=f)
