import React, { useState, useCallback } from 'react';
import { VideoAnalysis, AnalysisStatus } from '@/lib/types/video';

interface UseVideoAnalysisReturn {
  selectedFile: File | null;
  downloadedVideoUrl: string | null;
  analysis: VideoAnalysis | null;
  streamedAnalysis: VideoAnalysis | null;
  error: string | null;
  status: AnalysisStatus;
  analyzeVideo: (file: File) => Promise<void>;
  analyzeVideoUrl: (url: string) => Promise<void>;
  cancelAnalysis: () => void;
  setStatus: (status: AnalysisStatus) => void;
}

export function useVideoAnalysis(): UseVideoAnalysisReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadedVideoUrl, setDownloadedVideoUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [streamedAnalysis, setStreamedAnalysis] = useState<VideoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>({
    stage: 'complete',
    currentStep: '',
    progress: 0,
  });

  const cancelAnalysis = useCallback(() => {
    setStatus({ stage: 'complete', currentStep: '', progress: 0 });
    setError(null);
    setAnalysis(null);
    setStreamedAnalysis(null);
    setSelectedFile(null);
    setDownloadedVideoUrl(null);
  }, []);

  const analyzeVideo = useCallback(async (file: File) => {
    try {
      setSelectedFile(file);
      setDownloadedVideoUrl(null);
      setError(null);
      setAnalysis(null);
      setStreamedAnalysis(null);
      setStatus({
        stage: 'uploading',
        currentStep: 'Uploading video...',
        progress: 0,
      });

      // ... rest of the analyzeVideo function ...
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze video');
      setStatus({ stage: 'complete', currentStep: '', progress: 0 });
    }
  }, []);

  const analyzeVideoUrl = useCallback(async (url: string) => {
    try {
      setSelectedFile(null);
      setDownloadedVideoUrl(null);
      setError(null);
      setAnalysis(null);
      setStreamedAnalysis(null);
      setStatus({
        stage: 'uploading',
        currentStep: 'Downloading video...',
        progress: 0,
      });

      const response = await fetch('/api/video/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze video');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to read response');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === 'status') {
              setStatus(data.status);
            } else if (data.type === 'analysis') {
              setStreamedAnalysis(data.analysis);
              if (data.analysis.status === 'complete') {
                setAnalysis(data.analysis);
                setStatus({ stage: 'complete', currentStep: '', progress: 100 });
                if (data.analysis.videoPath) {
                  setDownloadedVideoUrl(`/videos/${data.analysis.videoPath}`);
                }
              }
            }
          } catch (e) {
            console.error('Failed to parse streaming response:', e);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze video');
      setStatus({ stage: 'complete', currentStep: '', progress: 0 });
    }
  }, []);

  return {
    selectedFile,
    downloadedVideoUrl,
    analysis,
    streamedAnalysis,
    error,
    status,
    analyzeVideo,
    analyzeVideoUrl,
    cancelAnalysis,
    setStatus
  };
} 