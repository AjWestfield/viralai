'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassPanel from '@/components/layout/GlassPanel';
import HeroPanel from '@/components/layout/HeroPanel';
import UploadZone from '@/components/upload/UploadZone';
import VideoPreview from '@/components/upload/VideoPreview';
import { useVideoAnalysis } from '@/lib/hooks/useVideoAnalysis';
import { getScoreCategory, getScoreColor } from '@/lib/analysis/viralScore';

export default function Home() {
  const { 
    analysis, 
    status, 
    streamedAnalysis, 
    downloadedVideoFile,
    analyzeVideo, 
    analyzeVideoUrl, 
    cancelAnalysis,
    setStatus 
  } = useVideoAnalysis();
  const [error, setError] = useState<string | null>(null);
  const isAnalyzing = status.stage !== 'complete' && status.progress > 0;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      setSelectedFile(file);
      await analyzeVideo(file);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze video';
      setError(errorMessage);
      console.error('Video analysis error:', err);
    }
  };

  const handleUrlSubmit = async (url: string) => {
    try {
      setError(null);
      setSelectedFile(null);
      await analyzeVideoUrl(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze video';
      setError(errorMessage);
      console.error('Video URL analysis error:', err);
    }
  };

  const handleCancel = () => {
    cancelAnalysis();
    setSelectedFile(null);
  };

  // Helper function to render analysis steps
  const renderAnalysisStep = (step: string) => {
    const isCompleted = step.endsWith('✓');
    const cleanStep = step.replace(' ✓', '');
    const isInProgress = !isCompleted && streamedAnalysis?.reasoning.split('\n').slice(-1)[0]?.includes(cleanStep);

    return (
      <div 
        key={step}
        className={`
          flex items-center gap-3 font-mono text-sm transition-all duration-300
          ${isCompleted ? 'text-emerald-400' : isInProgress ? 'text-white' : 'text-white/60'}
        `}
      >
        {/* Left side indicator */}
        <div className="w-5 h-5 relative flex-shrink-0">
          {isCompleted ? (
            // Checkmark for completed steps
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : isInProgress ? (
            // Loading spinner for in-progress step
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          ) : (
            // Empty state for pending steps
            <div className="w-5 h-5 rounded-full border-2 border-white/10" />
          )}
        </div>

        {/* Step text with loading indicator */}
        <div className="flex-1 flex items-center gap-2">
          {isInProgress ? (
            <>
              <div className="flex items-center gap-2">
                <div className="relative">
                  {/* Text with glow effect */}
                  <span className="relative inline-block animate-pulse">
                    {cleanStep}
                    <span className="absolute inset-0 bg-emerald-400/5 blur-sm rounded" />
                  </span>
                  {/* Animated underline */}
                  <div className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-emerald-400/0 via-emerald-400 to-emerald-400/0">
                    <div className="absolute inset-0 animate-shimmer" />
                  </div>
                </div>
              </div>
              <span className="text-xs text-emerald-400/80 animate-pulse">
                Processing...
              </span>
            </>
          ) : (
            <span>{cleanStep}</span>
          )}
        </div>
      </div>
    );
  };

  // Add this keyframe animation to your globals.css or tailwind.config.js
  const shimmerAnimation = {
    '@keyframes shimmer': {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(100%)' }
    }
  };

  return (
    <DashboardLayout>
      {/* Hero Section */}
      <HeroPanel />

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassPanel>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Upload Video</h2>
            <UploadZone 
              onFileSelect={handleFileUpload}
              onUrlSubmit={handleUrlSubmit}
              status={status}
              setStatus={setStatus}
              streamedAnalysis={streamedAnalysis}
              disabled={status.stage !== 'complete' && status.stage !== 'uploading'}
            />
            {error && (
              <div className="text-red-500 text-sm mt-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="font-medium mb-1">Error analyzing video:</div>
                <div className="text-red-400">{error}</div>
                <div className="mt-2 text-xs text-red-400/80">
                  Please ensure your video:
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Is in MP4, MOV, or AVI format</li>
                    <li>Is less than 100MB in size</li>
                    <li>Is not corrupted or encrypted</li>
                    <li>Has a valid and accessible URL (if using URL input)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Analysis Results</h2>
            {analysis ? (
              <>
                {/* Overall Score */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white/60">Overall Score</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">
                        {Math.round(analysis.result.score * 100)}%
                      </span>
                      <div className="text-lg text-white/80 p-3 rounded-lg bg-white/5">
                        Viral Potential: High
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">engagement cues</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full bg-white/10">
                        <div 
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${analysis.result.engagementCues * 100}%` }}
                        />
                      </div>
                      <span className="text-white/80 w-12 text-right">
                        {Math.round(analysis.result.engagementCues * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/60">trend alignment</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full bg-white/10">
                        <div 
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${analysis.result.trendAlignment * 100}%` }}
                        />
                      </div>
                      <span className="text-white/80 w-12 text-right">
                        {Math.round(analysis.result.trendAlignment * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/60">content novelty</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full bg-white/10">
                        <div 
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${analysis.result.contentNovelty * 100}%` }}
                        />
                      </div>
                      <span className="text-white/80 w-12 text-right">
                        {Math.round(analysis.result.contentNovelty * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/60">production quality</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full bg-white/10">
                        <div 
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${analysis.result.productionQuality * 100}%` }}
                        />
                      </div>
                      <span className="text-white/80 w-12 text-right">
                        {Math.round(analysis.result.productionQuality * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/60">audience match</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full bg-white/10">
                        <div 
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${analysis.result.audienceMatch * 100}%` }}
                        />
                      </div>
                      <span className="text-white/80 w-12 text-right">
                        {Math.round(analysis.result.audienceMatch * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Analysis Reasoning */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Analysis Reasoning</h3>
                  <div className="text-white/80 text-sm whitespace-pre-wrap">
                    {analysis.reasoning}
                  </div>
                </div>

                {/* Video Details */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Video Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/5">
                      <span className="text-white/60 text-sm">Duration</span>
                      <div className="text-white font-medium mt-1">
                        {Math.round(analysis.metadata.duration)}s
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <span className="text-white/60 text-sm">Resolution</span>
                      <div className="text-white font-medium mt-1">
                        {analysis.metadata.video.width}x{analysis.metadata.video.height}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <span className="text-white/60 text-sm">FPS</span>
                      <div className="text-white font-medium mt-1">
                        {analysis.metadata.video.fps}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <span className="text-white/60 text-sm">Format</span>
                      <div className="text-white font-medium mt-1">
                        {analysis.metadata.format.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 mb-4 rounded-full bg-[#1a2e44] flex items-center justify-center">
                  <svg 
                    className="w-6 h-6 text-[#6EE7B7]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium text-white/80">
                  No Video Analysis Yet
                </p>
                <p className="text-white/60 max-w-sm mt-2">
                  Upload a video to analyze its viral potential, engagement metrics, and content quality score
                </p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Video Preview Section */}
      {(selectedFile || downloadedVideoFile) && isAnalyzing && (
        <div className="relative rounded-lg overflow-hidden bg-black/20">
          <VideoPreview 
            videoFile={selectedFile || downloadedVideoFile}
            isAnalyzing={isAnalyzing}
          />
        </div>
      )}

      {/* Focus View Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="max-w-4xl w-full mx-4">
            <div className="bg-[#0A1628] rounded-2xl p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a2e44] flex items-center justify-center">
                    <svg 
                      className="w-4 h-4 text-[#6EE7B7]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">Analyzing Video</h2>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Video Preview */}
              <div className="relative rounded-lg overflow-hidden bg-black/20">
                <VideoPreview 
                  videoFile={selectedFile || downloadedVideoFile}
                  isAnalyzing={true}
                />
              </div>

              {/* Progress and Analysis */}
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#6EE7B7] to-[rgba(88,101,242,1)] rounded-full transition-all duration-300"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
                
                {/* Status Text */}
                <div className="space-y-2">
                  <p className="text-white/80 font-medium">
                    {status.currentStep} ({status.progress}%)
                  </p>
                </div>

                {/* Chain of Thought Analysis */}
                {streamedAnalysis && streamedAnalysis.reasoning && (
                  <div className="mt-6 text-left">
                    <div className="space-y-4 bg-white/5 rounded-lg p-4">
                      <h3 className="text-white/80 font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Chain of Thought Analysis
                      </h3>
                      <div className="space-y-2">
                        {streamedAnalysis.reasoning.split('\n')
                          .filter(line => line.trim() !== '')
                          .map((line, i) => renderAnalysisStep(line))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
