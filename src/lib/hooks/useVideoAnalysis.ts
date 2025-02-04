import { useState, useEffect } from 'react';
import { VideoAnalysis, ProcessingStatus } from '../types/video';

export function useVideoAnalysis() {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'uploading',
    progress: 0,
    currentStep: ''
  });
  const [streamedAnalysis, setStreamedAnalysis] = useState<{
    reasoning: string;
    citations: { url: string; title: string; }[];
  }>({
    reasoning: '',
    citations: []
  });

  const analyzeVideo = async (file: File) => {
    let uploadInterval: NodeJS.Timeout;

    try {
      // Reset states
      setAnalysis(null);
      setStreamedAnalysis({ 
        reasoning: 'Starting video analysis...\n', 
        citations: [] 
      });
      setStatus({ 
        stage: 'uploading', 
        progress: 0,
        currentStep: 'Preparing upload...' 
      });

      const formData = new FormData();
      formData.append('video', file);

      // Start showing initial analysis steps
      let uploadProgress = 0;
      let lastStep = -1; // Track the last shown step
      
      uploadInterval = setInterval(() => {
        if (uploadProgress < 85) {
          uploadProgress += Math.random() * 3 + 1;
          if (uploadProgress > 85) uploadProgress = 85;
          
          // Add real-time analysis steps during upload
          const currentStep = Math.floor(uploadProgress / 17);
          
          // Only show new step if it hasn't been shown before
          if (currentStep > lastStep) {
            lastStep = currentStep;
            let newReasoning = '';
            
            switch(currentStep) {
              case 0:
                newReasoning = 'Analyzing video format and container type... ';
                break;
              case 1:
                newReasoning = 'Checking video dimensions and aspect ratio... ';
                break;
              case 2:
                newReasoning = 'Evaluating frame rate and motion quality... ';
                break;
              case 3:
                newReasoning = 'Assessing audio configuration... ';
                break;
              case 4:
                newReasoning = 'Preparing for deep content analysis... ';
                break;
            }

            if (newReasoning) {
              setStreamedAnalysis(prev => ({
                ...prev,
                reasoning: prev.reasoning + newReasoning
              }));
            }
          }

          setStatus({ 
            stage: 'uploading', 
            progress: Math.round(uploadProgress),
            currentStep: 'Uploading and analyzing video...'
          });
        }
      }, 500);

      // Make the API request with streaming enabled
      console.log('Starting video upload...');
      const response = await fetch('/api/video/analyze', {
        method: 'POST',
        body: formData
      });

      // Clear upload interval
      clearInterval(uploadInterval);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        throw new Error(errorData.error || 'Failed to analyze video');
      }

      // Set up streaming response handling
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let analysisProgress = 90;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk and parse the JSON
          const chunk = decoder.decode(value);
          try {
            const data = JSON.parse(chunk);
            
            // Update progress and status
            if (data.progress) {
              analysisProgress = Math.min(98, 85 + (data.progress * 0.13)); // More realistic progress scaling
              setStatus({
                stage: 'analyzing',
                progress: Math.round(analysisProgress),
                currentStep: data.currentStep || 'Analyzing video content...'
              });
            }

            // Update streamed analysis if available
            if (data.reasoning) {
              setStreamedAnalysis(prev => ({
                reasoning: prev.reasoning + data.reasoning + ' ',
                citations: data.citations ? [
                  ...prev.citations,
                  ...data.citations.map((citation: any) => ({
                    url: citation.url || citation,
                    title: citation.title || citation.url?.split('/').pop()?.replace(/-/g, ' ') || citation
                  }))
                ] : prev.citations
              }));
            }

            // If final result is received
            if (data.result) {
              setAnalysis(data);
              setStatus({ 
                stage: 'complete', 
                progress: 100,
                currentStep: 'Analysis complete!'
              });
            }
          } catch (e) {
            console.error('Error parsing streaming chunk:', e);
          }
        }
      }

      return analysis;
    } catch (error) {
      console.error('Video analysis error:', error);
      // Clear intervals
      clearInterval(uploadInterval);
      
      setStatus({
        stage: 'complete',
        progress: 0,
        currentStep: 'Analysis failed',
        error: error instanceof Error ? error.message : 'Failed to analyze video'
      });
      throw error;
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setStreamedAnalysis({ reasoning: '', citations: [] });
    setStatus({ 
      stage: 'uploading', 
      progress: 0,
      currentStep: '' 
    });
  };

  return {
    analysis,
    status,
    streamedAnalysis,
    analyzeVideo,
    resetAnalysis
  };
} 