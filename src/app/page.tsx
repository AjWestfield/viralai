'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassPanel from '@/components/layout/GlassPanel';
import HeroPanel from '@/components/layout/HeroPanel';
import UploadZone from '@/components/upload/UploadZone';
import { useVideoAnalysis } from '@/lib/hooks/useVideoAnalysis';
import { getScoreCategory, getScoreColor } from '@/lib/analysis/viralScore';

export default function Home() {
  const { analysis, status, streamedAnalysis, analyzeVideo } = useVideoAnalysis();
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      await analyzeVideo(file);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze video';
      setError(errorMessage);
      console.error('Video analysis error:', err);
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
              status={status}
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
                  </ul>
                </div>
              </div>
            )}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Analysis Results</h2>
            {analysis ? (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Overall Score</span>
                    <span className="text-4xl font-bold text-white">
                      {Math.round(analysis.result.score * 100)}%
                    </span>
                  </div>
                  <div className="text-lg text-white/80 p-3 rounded-lg bg-[rgba(110,231,183,0.05)] border border-[#6EE7B7]/10">
                    {getScoreCategory(analysis.result.score)}
                  </div>
                  <div className="space-y-4 mt-6">
                    {Object.entries(analysis.result).map(([key, value]) => {
                      if (key === 'score') return null;
                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-white/60">
                            {key.split(/(?=[A-Z])/).join(' ').toLowerCase()}
                          </span>
                          <div className="flex items-center gap-4">
                            <div className="w-32 bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#6EE7B7] to-[rgba(88,101,242,1)] rounded-full"
                                style={{ width: `${value * 100}%` }}
                              />
                            </div>
                            <span className="text-white/80 w-12 text-right">
                              {Math.round(value * 100)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Analysis Reasoning */}
                {analysis.reasoning && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Analysis Reasoning</h3>
                    <div className="text-white/80 text-sm space-y-2">
                      <p>{analysis.reasoning}</p>
                    </div>
                  </div>
                )}

                {/* Citations */}
                {analysis.citations && analysis.citations.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Analysis Sources</h3>
                    <div className="space-y-2">
                      {analysis.citations.map((citation, index) => (
                        <div key={index} className="text-sm text-white/60 bg-white/5 p-2 rounded">
                          {citation}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
    </DashboardLayout>
  );
}
