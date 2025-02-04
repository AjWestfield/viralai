import { useState, useEffect } from 'react';
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
  analyzeVideo: (file: File) => Promise<VideoAnalysis | null>;
  resetAnalysis: () => void;
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

  const analyzeVideo = async (file: File): Promise<VideoAnalysis | null> => {
    let uploadInterval: NodeJS.Timeout;

    try {
      // Reset states
      setAnalysis(null);
      setStreamedAnalysis({ 
        reasoning: '', 
        citations: [],
        displayedSteps: new Set()
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
      let lastUpdate = Date.now();
      
      uploadInterval = setInterval(() => {
        const now = Date.now();
        const timeDiff = now - lastUpdate;
        
        // Calculate progress based on time elapsed
        if (uploadProgress < 30) {
          // Initial upload phase - faster progress
          uploadProgress += (timeDiff / 1000) * 5; // 5% per second
        } else if (uploadProgress < 60) {
          // Processing phase - slower progress
          uploadProgress += (timeDiff / 1000) * 2; // 2% per second
        } else if (uploadProgress < 85) {
          // Analysis phase - even slower progress
          uploadProgress += (timeDiff / 1000) * 1; // 1% per second
        }
        
        // Cap progress at 85% until we get actual completion
        if (uploadProgress > 85) uploadProgress = 85;
        
        // Update last update time
        lastUpdate = now;

        // Update status with appropriate step message
        let currentStep = 'Uploading video...';
        if (uploadProgress > 30) currentStep = 'Processing video metadata...';
        if (uploadProgress > 60) currentStep = 'Analyzing content...';
        if (uploadProgress > 80) currentStep = 'Finalizing analysis...';

        setStatus({
          stage: uploadProgress >= 60 ? 'analyzing' : 'uploading',
          progress: Math.round(uploadProgress),
          currentStep
        });

        // Add analysis steps as progress increases, checking for duplicates
        const addStep = (step: string, message: string) => {
          setStreamedAnalysis(prev => {
            // If step already exists, don't add it again
            if (prev.displayedSteps.has(step)) {
              return prev;
            }
            
            // Get current lines and mark the previous step as complete
            const lines = prev.reasoning.split('\n').filter(line => line.trim() !== '');
            const updatedLines = lines.map((line, index) => {
              // Only add checkmark to the previous step when adding a new one
              if (index === lines.length - 1 && line.includes('...') && !line.includes('✓')) {
                return line + ' ✓';
              }
              return line;
            });
            
            // Add the new step
            return {
              ...prev,
              reasoning: [...updatedLines, message].join('\n') + '\n',
              displayedSteps: new Set([...prev.displayedSteps, step])
            };
          });
        };

        // Add steps sequentially based on progress
        if (uploadProgress > 30 && !streamedAnalysis.displayedSteps.has('format')) {
          addStep('format', 'Analyzing video format and technical specifications...');
        }
        if (uploadProgress > 42 && !streamedAnalysis.displayedSteps.has('content')) {
          addStep('content', 'Evaluating content characteristics and engagement potential...');
        }
        if (uploadProgress > 55 && !streamedAnalysis.displayedSteps.has('comparison')) {
          addStep('comparison', 'Comparing with similar content and viral patterns...');
        }
        if (uploadProgress > 70 && !streamedAnalysis.displayedSteps.has('score')) {
          addStep('score', 'Calculating viral potential score...');
        }
        if (uploadProgress > 82 && !streamedAnalysis.displayedSteps.has('finalizing')) {
          addStep('finalizing', 'Finalizing Analysis Results...');
        }
        
        // Mark the final step as complete when reaching 85%
        if (uploadProgress > 85) {
          setStreamedAnalysis(prev => {
            const lines = prev.reasoning.split('\n').filter(line => line.trim() !== '');
            const updatedLines = lines.map((line, index) => {
              if (index === lines.length - 1 && line.includes('...') && !line.includes('✓')) {
                return line + ' ✓';
              }
              return line;
            });
            return {
              ...prev,
              reasoning: updatedLines.join('\n') + '\n'
            };
          });
        }
      }, 200); // Update every 200ms for smooth progress

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

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
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
            
            // Update progress based on actual analysis progress
            if (data.progress) {
              setStatus({
                stage: 'analyzing',
                progress: Math.min(99, 85 + (data.progress * 0.15)),
                currentStep: data.currentStep || 'Processing analysis results...'
              });
            }

            // Update streamed analysis if available, preventing duplicates
            if (data.reasoning || data.content || data.message?.content) {
              setStreamedAnalysis(prev => {
                const newReasoning = data.reasoning || 
                                   data.content || 
                                   data.message?.content || '';
                
                // Only add the reasoning if it's not already present
                const shouldAddReasoning = !prev.reasoning.includes(newReasoning);
                
                return {
                  ...prev,
                  reasoning: shouldAddReasoning ? prev.reasoning + newReasoning + '\n' : prev.reasoning,
                  citations: [...new Set([...prev.citations, ...(data.enrichedCitations || [])])],
                  displayedSteps: prev.displayedSteps
                };
              });
            }

            // If final result is received
            if (data.result) {
              const finalAnalysis = {
                ...data,
                reasoning: data.reasoning?.replace(/\n+/g, '\n').trim()
              };
              setAnalysis(finalAnalysis);
              
              // Show completion with a slight delay
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
    setStreamedAnalysis({ 
      reasoning: '', 
      citations: [],
      displayedSteps: new Set()
    });
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