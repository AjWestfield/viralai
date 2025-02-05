import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoAnalysis, ProcessingStatus } from '../types/video';
import { MediaCitation } from '../services/media-enricher';

interface UseVideoAnalysisReturn {
  analysis: VideoAnalysis | null;
  status: ProcessingStatus;
  streamedAnalysis: {
    reasoning: string;
    citations: MediaCitation[];
    displayedSteps: Set<string>;
  };
  downloadedVideoUrl: string | null;
  downloadedVideoFile: File | null;
  analyzeVideo: (file: File) => Promise<VideoAnalysis | null>;
  analyzeVideoUrl: (url: string) => Promise<VideoAnalysis | null>;
  resetAnalysis: () => void;
  cancelAnalysis: () => void;
  setStatus: (status: ProcessingStatus) => void;
}

export function useVideoAnalysis(): UseVideoAnalysisReturn {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'uploading',
    progress: 0,
    currentStep: ''
  });
  const [streamedAnalysis, setStreamedAnalysis] = useState<{
    reasoning: string;
    citations: MediaCitation[];
    displayedSteps: Set<string>;
  }>({
    reasoning: '',
    citations: [],
    displayedSteps: new Set()
  });
  const [downloadedVideoUrl, setDownloadedVideoUrl] = useState<string | null>(null);
  const [downloadedVideoFile, setDownloadedVideoFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cancelAnalysis = () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus({ stage: 'complete', progress: 0, currentStep: '' });
    setStreamedAnalysis({ reasoning: '', citations: [], displayedSteps: new Set() });
    setDownloadedVideoUrl(null);
    setDownloadedVideoFile(null);
  };

  const analyzeVideo = useCallback(async (file: File) => {
    try {
      setSelectedFile(file);
      setDownloadedVideoUrl(null);
      setError(null);
      setAnalysis(null);
      setStreamedAnalysis({ reasoning: '', citations: [], displayedSteps: new Set() });
      setStatus({
        stage: 'uploading',
        currentStep: 'Uploading video...',
        progress: 0,
      });

      // Setup abort controller
      abortControllerRef.current = new AbortController();

      // Create form data
      const formData = new FormData();
      formData.append('video', file);

      // Start progress simulation
      let uploadProgress = 0;
      let lastUpdate = Date.now();

      uploadIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeDiff = now - lastUpdate;
        
        // Calculate progress based on time elapsed
        if (uploadProgress < 30) {
          uploadProgress += (timeDiff / 1000) * 5; // 5% per second
        } else if (uploadProgress < 60) {
          uploadProgress += (timeDiff / 1000) * 2; // 2% per second
        } else if (uploadProgress < 85) {
          uploadProgress += (timeDiff / 1000) * 1; // 1% per second
        } else if (uploadProgress < 95) {
          uploadProgress += (timeDiff / 1000) * 0.2; // 0.2% per second
        }
        
        if (uploadProgress > 95) uploadProgress = 95;
        lastUpdate = now;

        let currentStep = 'Uploading video...';
        if (uploadProgress > 30) currentStep = 'Processing video metadata...';
        if (uploadProgress > 60) currentStep = 'Analyzing content...';
        if (uploadProgress > 80) currentStep = 'Finalizing analysis...';
        if (uploadProgress > 85) currentStep = 'Generating insights...';
        if (uploadProgress > 90) currentStep = 'Preparing results...';

        setStatus({
          stage: uploadProgress >= 60 ? 'analyzing' : 'uploading',
          progress: Math.round(uploadProgress),
          currentStep
        });

        // Add analysis steps
        const addStep = (step: string, message: string) => {
          setStreamedAnalysis(prev => {
            if (!prev || prev.displayedSteps.has(step)) {
              return prev || { reasoning: '', citations: [], displayedSteps: new Set() };
            }
            
            const lines = prev.reasoning.split('\n').filter(line => line.trim() !== '');
            const updatedLines = lines.map((line, index) => {
              if (index === lines.length - 1 && line.includes('...') && !line.includes('✓')) {
                return line + ' ✓';
              }
              return line;
            });
            
            return {
              ...prev,
              reasoning: [...updatedLines, message].join('\n') + '\n',
              displayedSteps: new Set([...prev.displayedSteps, step])
            };
          });
        };

        // Add steps sequentially based on progress
        if (uploadProgress > 30 && !streamedAnalysis?.displayedSteps.has('upload')) {
          addStep('upload', 'Uploading video file...');
        }
        if (uploadProgress > 42 && !streamedAnalysis?.displayedSteps.has('format')) {
          addStep('format', 'Analyzing video format and technical specifications...');
        }
        if (uploadProgress > 55 && !streamedAnalysis?.displayedSteps.has('content')) {
          addStep('content', 'Evaluating content characteristics...');
        }
        if (uploadProgress > 70 && !streamedAnalysis?.displayedSteps.has('score')) {
          addStep('score', 'Calculating viral potential score...');
        }
        if (uploadProgress > 82 && !streamedAnalysis?.displayedSteps.has('finalizing')) {
          addStep('finalizing', 'Finalizing Analysis Results...');
        }
      }, 100);

      // Make API request
      const response = await fetch('/api/video/analyze', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze video');
      }

      const result = await response.json();
      
      // Set the downloaded video URL
      if (result.videoPath) {
        const videoUrl = `/uploads/${result.videoPath}`;
        setDownloadedVideoUrl(videoUrl);

        // Fetch the video file and create a blob
        const videoResponse = await fetch(videoUrl);
        const videoBlob = await videoResponse.blob();
        const videoFile = new File([videoBlob], result.videoPath, { type: 'video/mp4' });
        setDownloadedVideoFile(videoFile);
      }
      
      setAnalysis(result);
      setStatus({ stage: 'complete', progress: 100, currentStep: 'Analysis complete' });

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Analysis cancelled');
      } else {
        console.error('Error analyzing video:', error);
        setError(error instanceof Error ? error.message : 'Failed to analyze video');
      }
      setStatus({ stage: 'complete', currentStep: '', progress: 0 });
      return null;
    } finally {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    }
  }, []);

  const analyzeVideoUrl = useCallback(async (url: string) => {
    try {
      setSelectedFile(null);
      setDownloadedVideoUrl(null);
      setError(null);
      setAnalysis(null);
      setStreamedAnalysis({ reasoning: '', citations: [], displayedSteps: new Set() });
      setStatus({
        stage: 'uploading',
        currentStep: 'Downloading video...',
        progress: 0,
      });

      // Setup abort controller
      abortControllerRef.current = new AbortController();

      // First, download the video
      console.log('Downloading video from URL:', url);
      const downloadResponse = await fetch('/api/video/download-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: abortControllerRef.current.signal
      });

      if (!downloadResponse.ok) {
        throw new Error('Failed to download video');
      }

      const downloadResult = await downloadResponse.json();
      if (downloadResult.videoPath) {
        // Set the downloaded video URL with the correct path
        const videoUrl = `/uploads/${downloadResult.videoPath}`;
        setDownloadedVideoUrl(videoUrl);

        // Fetch the video file and create a blob
        const videoResponse = await fetch(videoUrl);
        const videoBlob = await videoResponse.blob();
        const videoFile = new File([videoBlob], downloadResult.videoPath, { type: 'video/mp4' });
        setDownloadedVideoFile(videoFile);
      }

      // Start progress simulation
      let uploadProgress = 0;
      let lastUpdate = Date.now();

      uploadIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeDiff = now - lastUpdate;
        
        // Calculate progress based on time elapsed
        if (uploadProgress < 30) {
          uploadProgress += (timeDiff / 1000) * 5; // 5% per second
        } else if (uploadProgress < 60) {
          uploadProgress += (timeDiff / 1000) * 2; // 2% per second
        } else if (uploadProgress < 85) {
          uploadProgress += (timeDiff / 1000) * 1; // 1% per second
        } else if (uploadProgress < 95) {
          uploadProgress += (timeDiff / 1000) * 0.2; // 0.2% per second
        }
        
        if (uploadProgress > 95) uploadProgress = 95;
        lastUpdate = now;

        let currentStep = 'Downloading video...';
        if (uploadProgress > 30) currentStep = 'Processing video metadata...';
        if (uploadProgress > 60) currentStep = 'Analyzing content...';
        if (uploadProgress > 80) currentStep = 'Finalizing analysis...';
        if (uploadProgress > 85) currentStep = 'Generating insights...';
        if (uploadProgress > 90) currentStep = 'Preparing results...';

        setStatus({
          stage: uploadProgress >= 60 ? 'analyzing' : 'uploading',
          progress: Math.round(uploadProgress),
          currentStep
        });

        // Add analysis steps
        const addStep = (step: string, message: string) => {
          setStreamedAnalysis(prev => {
            if (prev.displayedSteps.has(step)) {
              return prev;
            }
            
            const lines = prev.reasoning.split('\n').filter(line => line.trim() !== '');
            const updatedLines = lines.map((line, index) => {
              if (index === lines.length - 1 && line.includes('...') && !line.includes('✓')) {
                return line + ' ✓';
              }
              return line;
            });
            
            return {
              ...prev,
              reasoning: [...updatedLines, message].join('\n') + '\n',
              displayedSteps: new Set([...prev.displayedSteps, step])
            };
          });
        };

        // Add steps sequentially based on progress
        if (uploadProgress > 30 && !streamedAnalysis.displayedSteps.has('download')) {
          addStep('download', 'Downloading video from URL...');
        }
        if (uploadProgress > 42 && !streamedAnalysis.displayedSteps.has('format')) {
          addStep('format', 'Analyzing video format and technical specifications...');
        }
        if (uploadProgress > 55 && !streamedAnalysis.displayedSteps.has('content')) {
          addStep('content', 'Evaluating content characteristics...');
        }
        if (uploadProgress > 70 && !streamedAnalysis.displayedSteps.has('score')) {
          addStep('score', 'Calculating viral potential score...');
        }
        if (uploadProgress > 82 && !streamedAnalysis.displayedSteps.has('finalizing')) {
          addStep('finalizing', 'Finalizing Analysis Results...');
        }
      }, 100);

      // Make API request
      const response = await fetch('/api/video/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Failed to analyze video');
      }

      const result = await response.json();
      
      setAnalysis(result);
      setStatus({ stage: 'complete', progress: 100, currentStep: 'Analysis complete' });

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Analysis cancelled');
      } else {
        console.error('Error analyzing video:', error);
        throw error;
      }
      return null;
    } finally {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const resetAnalysis = () => {
    setAnalysis(null);
    setStreamedAnalysis({ reasoning: '', citations: [], displayedSteps: new Set() });
    setStatus({ stage: 'uploading', progress: 0, currentStep: '' });
    setDownloadedVideoUrl(null);
    setDownloadedVideoFile(null);
  };

  return {
    analysis,
    status,
    streamedAnalysis,
    downloadedVideoUrl,
    downloadedVideoFile,
    analyzeVideo,
    analyzeVideoUrl,
    resetAnalysis,
    cancelAnalysis,
    setStatus
  };
} 