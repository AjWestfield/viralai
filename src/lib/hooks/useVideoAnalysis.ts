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
        reasoning: '', 
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
        if (uploadProgress < 98) {
          // Slower, more natural progress increments
          uploadProgress += Math.random() * 2 + 1;
          if (uploadProgress > 98) uploadProgress = 98;
          
          // Adjust step thresholds for more natural progression
          const currentStep = Math.floor(uploadProgress / 16); // Adjusted for 6 steps
          
          if (currentStep > lastStep) {
            lastStep = currentStep;
            let newReasoning = '';
            
            // Add delays between steps
            setTimeout(() => {
              switch(currentStep) {
                case 0:
                  newReasoning = 'Starting video analysis...\n';
                  break;
                case 1:
                  newReasoning = 'Analyzing video format and container type...\n';
                  break;
                case 2:
                  newReasoning = 'Checking video dimensions and aspect ratio...\n';
                  break;
                case 3:
                  newReasoning = 'Evaluating frame rate and motion quality...\n';
                  break;
                case 4:
                  newReasoning = 'Assessing audio configuration...\n';
                  break;
                case 5:
                  newReasoning = 'Finalizing Analysis Results...\n';
                  break;
              }

              if (newReasoning) {
                setStreamedAnalysis(prev => ({
                  ...prev,
                  reasoning: prev.reasoning + newReasoning
                }));
              }
            }, Math.random() * 1000 + 500); // Random delay between 500-1500ms
          }

          setStatus({ 
            stage: 'uploading', 
            progress: Math.round(uploadProgress),
            currentStep: 'Uploading and analyzing video...'
          });
        }
      }, 400);

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
          
          // When streaming is complete, show 100%
          if (done) {
            setStatus({ 
              stage: 'complete', 
              progress: 100,
              currentStep: 'Analysis complete!'
            });
            break;
          }

          // Decode the chunk and parse the JSON
          const chunk = decoder.decode(value);
          try {
            const data = JSON.parse(chunk);
            
            // Update progress and status during streaming
            if (data.progress) {
              analysisProgress = Math.min(98, 90 + (data.progress * 0.2));
              setStatus({
                stage: 'analyzing',
                progress: Math.round(analysisProgress),
                currentStep: 'Finalizing analysis results...'
              });
            }

            // Update streamed analysis if available
            if (data.reasoning || data.content || data.message?.content) {
              setStreamedAnalysis(prev => {
                // Extract content from think tags if present
                const thinkContent = data.content?.match(/<think>(.*?)<\/think>/s)?.[1]?.trim() || 
                                   data.message?.content?.match(/<think>(.*?)<\/think>/s)?.[1]?.trim();
                
                // Get terminal output if available
                const terminalOutput = data.message?.content || '';
                
                // Combine reasoning sources
                const newReasoning = thinkContent || data.reasoning || terminalOutput || '';
                
                return {
                  reasoning: prev.reasoning + (newReasoning ? newReasoning + '\n' : ''),
                  citations: data.citations ? [
                    ...prev.citations,
                    ...data.citations.map((citation: any) => ({
                      url: citation.url || citation,
                      title: citation.title || citation.url?.split('/').pop()?.replace(/-/g, ' ') || citation
                    }))
                  ] : prev.citations
                };
              });
            }

            // If final result is received
            if (data.result) {
              // Format the final analysis nicely
              const finalAnalysis = {
                ...data,
                reasoning: data.reasoning?.replace(/\n+/g, '\n').trim()
              };
              setAnalysis(finalAnalysis);
              
              // Add delay before showing 100% completion
              setTimeout(() => {
                setStatus({ 
                  stage: 'complete', 
                  progress: 100,
                  currentStep: 'Analysis complete!'
                });
              }, 500);
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