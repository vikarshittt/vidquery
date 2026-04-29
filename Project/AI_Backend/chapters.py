import re
from typing import List, Dict, Optional
from youtube_transcript_api import YouTubeTranscriptApi
from datetime import timedelta
import requests
from bs4 import BeautifulSoup
# Use Groq instead of Gemini
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os

class VideoChapterExtractor:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=os.getenv("GROQ_API_KEY")
        )
    
    def extract_chapters_from_description(self, video_id: str) -> Optional[List[Dict]]:
        """Extract chapters from video description if they exist"""
        try:
            url = f"https://www.youtube.com/watch?v={video_id}"
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            description_elem = soup.find('meta', {'name': 'description'})
            if not description_elem:
                return None
            
            description = description_elem.get('content', '')
            
            timestamp_pattern = r'(\\d+:\\d+(?::\\d+)?)\\s+(.+)'
            matches = re.findall(timestamp_pattern, description)
            
            if matches:
                chapters = []
                for time_str, title in matches:
                    seconds = self._timestamp_to_seconds(time_str)
                    chapters.append({
                        "title": title.strip(),
                        "timestamp": time_str,
                        "seconds": seconds,
                        "url": f"https://youtu.be/{video_id}?t={seconds}"
                    })
                return chapters
        except Exception as e:
            print(f"Error extracting chapters from description: {e}")
        
        return None
    
    def generate_chapters_from_transcript(self, video_id: str, transcript_text: str) -> List[Dict]:
        """Use AI to automatically generate chapters from transcript"""
        
        segments = self._segment_transcript(transcript_text)
        
        prompt_template = """
        Analyze the following transcript segment and generate a concise chapter title.
        The title should be 3-7 words that capture the main topic of this section.
        
        TRANSCRIPT SEGMENT:
        {segment}
        
        Generate ONLY the chapter title (no explanation, no timestamps, just the title):
        """
        
        prompt = PromptTemplate.from_template(prompt_template)
        chain = prompt | self.llm | StrOutputParser()
        
        chapters = []
        word_count = 0
        
        for i, segment in enumerate(segments[:10]):  # Max 10
            try:
                title = chain.invoke({"segment": segment}).strip()
                
                word_count += len(segment.split())
                approx_duration_minutes = word_count / 150
                seconds = int(approx_duration_minutes * 60)
                
                chapters.append({
                    "title": title,
                    "timestamp": str(timedelta(seconds=seconds)),
                    "seconds": seconds,
                    "url": f"https://youtu.be/{video_id}?t={seconds}"
                })
            except Exception as e:
                print(f"Error generating chapter {i}: {e}")
                continue
        
        return chapters
    
    def _timestamp_to_seconds(self, timestamp: str) -> int:
        parts = list(map(int, timestamp.split(':')))
        if len(parts) == 2:
            return parts[0] * 60 + parts[1]
        elif len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        return 0
    
    def _segment_transcript(self, transcript: str, num_segments: int = 10) -> List[str]:
        words = transcript.split()
        segment_size = len(words) // num_segments
        
        segments = []
        for i in range(num_segments):
            start = i * segment_size
            end = (i + 1) * segment_size if i < num_segments - 1 else len(words)
            segment = ' '.join(words[start:end])
            if segment.strip():
                segments.append(segment)
        return segments
    
    def get_chapters(self, video_id: str, transcript: str) -> Dict:
        chapters = self.extract_chapters_from_description(video_id)
        if not chapters:
            chapters = self.generate_chapters_from_transcript(video_id, transcript)
        
        return {
            "video_id": video_id,
            "chapters": chapters,
            "total_chapters": len(chapters)
        }
