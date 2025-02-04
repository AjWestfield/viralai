import { useState } from 'react';
import { VideoAnalysis, ProcessingStatus } from '../types/video';

export const useVideoAnalysis = () => {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'uploading',
    progress: 0
  });

  const analyzeVideo = async (file: File) => {
    try {
      // Start with uploading stage
      setStatus({ stage: 'uploading', progress: 10 });

      const formData = new FormData();
      formData.append('video', file);

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setStatus(prev => {
          if (prev.progress >= 40) {
            clearInterval(uploadInterval);
            return { stage: 'preprocessing', progress: 40 };
          }
          return { ...prev, progress: prev.progress + 5 };
        });
      }, 300);

      const response = await fetch('/api/video/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze video');
      }

      // Simulate analysis progress
      const analysisInterval = setInterval(() => {
        setStatus(prev => {
          if (prev.progress >= 90) {
            clearInterval(analysisInterval);
            return { stage: 'analyzing', progress: 90 };
          }
          return { ...prev, progress: prev.progress + 5 };
        });
      }, 200);

      const result = await response.json();
      
      // Clear any remaining intervals
      clearInterval(uploadInterval);
      clearInterval(analysisInterval);

      setStatus({ stage: 'complete', progress: 100 });
      setAnalysis(result);

      return result;
    } catch (error) {
      setStatus({
        stage: 'complete',
        progress: 0,
        error: error instanceof Error ? error.message : 'Failed to analyze video'
      });
      throw error;
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setStatus({ stage: 'uploading', progress: 0 });
  };

  return {
    analysis,
    status,
    analyzeVideo,
    resetAnalysis
  };
}; 