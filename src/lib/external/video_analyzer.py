import os
import sys
import numpy as np
import torch
import cv2
from moviepy.editor import VideoFileClip
from pytube import YouTube
import faiss
from PIL import Image
import clip
from pyktok import TikTokScraper
from instaloader import Instaloader, Post
import json
from typing import Dict, List, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoAnalyzer:
    def __init__(self):
        # Initialize CLIP model
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.clip_model, self.preprocess = clip.load("ViT-B/32", device=self.device)
        
        # Initialize FAISS index
        self.feature_dimension = 512  # CLIP feature dimension
        self.index = faiss.IndexFlatL2(self.feature_dimension)
        
        # Initialize social media scrapers
        self.tiktok_scraper = TikTokScraper()
        self.instagram = Instaloader()
        
        logger.info("VideoAnalyzer initialized successfully")

    def extract_frames(self, video_path: str, num_frames: int = 10) -> List[Image.Image]:
        """Extract evenly spaced frames from video."""
        clip = VideoFileClip(video_path)
        duration = clip.duration
        frame_times = np.linspace(0, duration, num_frames)
        
        frames = []
        for t in frame_times:
            frame = clip.get_frame(t)
            frame_pil = Image.fromarray(frame)
            frames.append(frame_pil)
        
        clip.close()
        return frames

    def encode_frames(self, frames: List[Image.Image]) -> torch.Tensor:
        """Encode frames using CLIP."""
        preprocessed_frames = torch.stack([self.preprocess(frame) for frame in frames])
        with torch.no_grad():
            features = self.clip_model.encode_image(preprocessed_frames.to(self.device))
        return features.cpu().numpy()

    async def analyze_tiktok_trends(self, hashtag: str) -> Dict:
        """Analyze TikTok trends for a given hashtag."""
        try:
            trends = await self.tiktok_scraper.get_hashtag_videos(hashtag, count=50)
            return {
                "hashtag": hashtag,
                "total_videos": len(trends),
                "total_views": sum(video.stats.play_count for video in trends),
                "avg_likes": np.mean([video.stats.digg_count for video in trends]),
                "avg_comments": np.mean([video.stats.comment_count for video in trends]),
                "trending_sounds": list(set(video.music.title for video in trends))
            }
        except Exception as e:
            logger.error(f"Error analyzing TikTok trends: {str(e)}")
            return {}

    def analyze_instagram_post(self, url: str) -> Dict:
        """Analyze Instagram post metrics."""
        try:
            shortcode = url.split("/")[-2]
            post = Post.from_shortcode(self.instagram.context, shortcode)
            return {
                "likes": post.likes,
                "comments": post.comments,
                "caption": post.caption,
                "hashtags": post.caption_hashtags,
                "mentions": post.caption_mentions,
                "location": post.location
            }
        except Exception as e:
            logger.error(f"Error analyzing Instagram post: {str(e)}")
            return {}

    def find_similar_videos(self, query_features: np.ndarray, k: int = 5) -> Tuple[np.ndarray, np.ndarray]:
        """Find k most similar videos using FAISS."""
        distances, indices = self.index.search(query_features, k)
        return distances, indices

    def analyze_video(self, video_path: str, hashtag: Optional[str] = None) -> Dict:
        """Complete video analysis pipeline."""
        try:
            # Extract and encode frames
            frames = self.extract_frames(video_path)
            features = self.encode_frames(frames)
            
            # Get video metadata
            clip = VideoFileClip(video_path)
            metadata = {
                "duration": clip.duration,
                "fps": clip.fps,
                "size": clip.size,
                "audio": clip.audio is not None
            }
            clip.close()
            
            # Find similar videos
            distances, indices = self.find_similar_videos(features.mean(axis=0, keepdims=True))
            
            # Analyze social trends if hashtag provided
            trends = {}
            if hashtag:
                import asyncio
                trends = asyncio.run(self.analyze_tiktok_trends(hashtag))
            
            return {
                "metadata": metadata,
                "similarity_scores": distances.tolist(),
                "similar_video_indices": indices.tolist(),
                "social_trends": trends,
                "feature_vector": features.mean(axis=0).tolist()
            }
            
        except Exception as e:
            logger.error(f"Error in video analysis: {str(e)}")
            return {"error": str(e)}

    def download_youtube_video(self, url: str, output_path: str) -> str:
        """Download YouTube video for analysis."""
        try:
            yt = YouTube(url)
            video = yt.streams.filter(progressive=True, file_extension='mp4').first()
            return video.download(output_path=output_path)
        except Exception as e:
            logger.error(f"Error downloading YouTube video: {str(e)}")
            raise

if __name__ == "__main__":
    # Example usage
    analyzer = VideoAnalyzer()
    
    if len(sys.argv) < 2:
        print("Usage: python video_analyzer.py <video_path> [hashtag]")
        sys.exit(1)
    
    video_path = sys.argv[1]
    hashtag = sys.argv[2] if len(sys.argv) > 2 else None
    
    results = analyzer.analyze_video(video_path, hashtag)
    print(json.dumps(results, indent=2)) 