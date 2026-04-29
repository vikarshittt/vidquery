import os
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser




os.environ["GOOGLE_API_KEY"] = "YOUR_GOOGLE_API_KEY_HERE"
 

def get_youtube_transcript(video_id: str) -> str | None:
    print(f"Fetching transcript for video ID: {video_id}...")
    try:
        api = YouTubeTranscriptApi()
        transcript_snippets = api.fetch(video_id, languages=['en'])
        transcript_text = " ".join(snippet.text for snippet in transcript_snippets)
        print("Transcript fetched successfully.")
        return transcript_text
    except TranscriptsDisabled:
        print(f"Transcripts are disabled for video: {video_id}")
        return None
    except Exception as e:
        print(f"An error occurred while fetching transcript: {e}")
        return None




def create_rag_chain(video_id: str):
    transcript = get_youtube_transcript(video_id)
    if not transcript:
        print("Failed to build RAG chain: No transcript available.")
        return None
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_text(transcript)
    if not chunks:
        print("Failed to build RAG chain: Transcript could not be split.")
        return None
    print(f"Transcript split into {len(chunks)} chunks.")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    vector_store = FAISS.from_texts(chunks, embeddings)
    retriever = vector_store.as_retriever(search_kwargs={"k": 4})
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.7)
    prompt_template = """
        You are a helpful YouTube assistant. Your job is to answer the user's question
        about the video based *only* on the following transcript context.

        If the answer is not in the context, just say:
        "I'm sorry, I couldn't find that information in the video transcript."

        CONTEXT:
        {context}

        QUESTION:
        {question}

        ANSWER:
        """
    prompt = PromptTemplate.from_template(prompt_template)
    def format_docs(docs):
        return "\n\n---\n\n".join(doc.page_content for doc in docs)
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    print("RAG chain created successfully.")
    return rag_chain

if __name__ == "__main__":
    video_id = "y122nhdFMkI"
    chain = create_rag_chain(video_id)
    if chain:
        print("\n--- Starting Chatbot ---")
        query1 = "What is the main summary of this video?"
        print(f"\nQuery: {query1}")
        answer1 = chain.invoke(query1)
        print(f"Answer: {answer1}")
        query2 = "What does the speaker say about the 'A-Frame'?"
        print(f"\nQuery: {query2}")
        answer2 = chain.invoke(query2)
        print(f"Answer: {answer2}")
        query3 = "What is the key to making VR on the web?"
        print(f"\nQuery: {query3}")
        answer3 = chain.invoke(query3)
        print(f"Answer: {answer3}")
