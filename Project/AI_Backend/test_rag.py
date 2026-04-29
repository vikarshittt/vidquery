import os
import sys
import traceback
from dotenv import load_dotenv

load_dotenv()

try:
    from main import create_rag_chain
    test_video_id = "dQw4w9WgXcQ"
    print(f"Testing with video ID: {test_video_id}")
    chain = create_rag_chain(test_video_id)
    if chain:
        print("Success! Chain was created.")
    else:
        print("Failure. create_rag_chain returned None.")
except Exception as e:
    with open("error_trace.txt", "w", encoding="utf-8") as f:
        traceback.print_exc(file=f)
