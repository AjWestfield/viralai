from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
import tempfile
from typing import Optional

# Add the external directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "../../../../lib/external"))
from video_analyzer import VideoAnalyzer

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the video analyzer
analyzer = VideoAnalyzer()

@app.post("/api/python/video-analysis")
async def analyze_video(
    file: UploadFile = File(...),
    hashtag: Optional[str] = None,
    youtube_url: Optional[str] = None
):
    try:
        # Create a temporary directory for video processing
        with tempfile.TemporaryDirectory() as temp_dir:
            video_path = os.path.join(temp_dir, "temp_video.mp4")
            
            if youtube_url:
                # Download YouTube video
                video_path = analyzer.download_youtube_video(youtube_url, temp_dir)
            else:
                # Save uploaded file
                with open(video_path, "wb") as buffer:
                    buffer.write(await file.read())
            
            # Analyze the video
            results = analyzer.analyze_video(video_path, hashtag)
            
            if "error" in results:
                raise HTTPException(status_code=500, detail=results["error"])
                
            return results
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/python/instagram-analysis")
async def analyze_instagram(url: str):
    try:
        results = analyzer.analyze_instagram_post(url)
        if not results:
            raise HTTPException(status_code=500, detail="Failed to analyze Instagram post")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/python/tiktok-trends")
async def analyze_tiktok(hashtag: str):
    try:
        results = await analyzer.analyze_tiktok_trends(hashtag)
        if not results:
            raise HTTPException(status_code=500, detail="Failed to analyze TikTok trends")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 