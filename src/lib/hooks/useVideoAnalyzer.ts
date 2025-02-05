import { useState } from 'react';

interface VideoAnalysis {
  metadata: {
    duration: number;
    fps: number;
    size: [number, number];
    audio: boolean;
  };
  similarity_scores: number[];
  similar_video_indices: number[];
  social_trends: {
    hashtag?: string;
    total_videos?: number;
    total_views?: number;
    avg_likes?: number;
    avg_comments?: number;
    trending_sounds?: string[];
  };
  feature_vector: number[];
}

interface InstagramAnalysis {
  likes: number;
  comments: number;
  caption: string;
  hashtags: string[];
  mentions: string[];
  location: string | null;
}

interface TikTokTrends {
  hashtag: string;
  total_videos: number;
  total_views: number;
  avg_likes: number;
  avg_comments: number;
  trending_sounds: string[];
}

interface UseVideoAnalyzerResult {
  loading: boolean;
  error: string | null;
  videoAnalysis: VideoAnalysis | null;
  instagramAnalysis: InstagramAnalysis | null;
  tiktokTrends: TikTokTrends | null;
  analyzeVideo: (file: File, hashtag?: string, youtubeUrl?: string) => Promise<void>;
  analyzeInstagramPost: (url: string) => Promise<void>;
  analyzeTikTokTrends: (hashtag: string) => Promise<void>;
  reset: () => void;
}

export function useVideoAnalyzer(): UseVideoAnalyzerResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysis | null>(null);
  const [instagramAnalysis, setInstagramAnalysis] = useState<InstagramAnalysis | null>(null);
  const [tiktokTrends, setTikTokTrends] = useState<TikTokTrends | null>(null);

  const reset = () => {
    setLoading(false);
    setError(null);
    setVideoAnalysis(null);
    setInstagramAnalysis(null);
    setTikTokTrends(null);
  };

  const analyzeVideo = async (file: File, hashtag?: string, youtubeUrl?: string) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      if (hashtag) formData.append('hashtag', hashtag);
      if (youtubeUrl) formData.append('youtube_url', youtubeUrl);

      const response = await fetch('/api/python-proxy/video-analysis', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setVideoAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error analyzing video:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeInstagramPost = async (url: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/python-proxy/instagram-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setInstagramAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error analyzing Instagram post:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTikTokTrends = async (hashtag: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/python-proxy/tiktok-trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashtag }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setTikTokTrends(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error analyzing TikTok trends:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    videoAnalysis,
    instagramAnalysis,
    tiktokTrends,
    analyzeVideo,
    analyzeInstagramPost,
    analyzeTikTokTrends,
    reset,
  };
} 