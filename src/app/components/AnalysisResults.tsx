import React from 'react';
import { MediaGrid } from './MediaGrid';

interface AnalysisResultsProps {
  overallScore: number;
  scores: {
    engagement: number;
    trend: number;
    novelty: number;
    quality: number;
    audience: number;
  };
  reasoning: string;
  citations: Array<{
    url: string;
    type: 'video' | 'image';
    timestamp?: string;
    thumbnail?: string;
    description?: string;
  }>;
  videoDetails: {
    duration: string;
    resolution: string;
    fps: number;
    format: string;
  };
}

export function AnalysisResults({
  overallScore,
  scores,
  reasoning,
  citations,
  videoDetails
}: AnalysisResultsProps) {
  const formatScore = (score: number) => `${Math.round(score * 100)}%`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Overall Score</h2>
        <span className="text-3xl font-bold">{formatScore(overallScore)}</span>
      </div>

      <div className="p-4 bg-gray-800/50 rounded-lg">
        <h3 className="text-lg font-medium mb-2">
          Viral Potential: {overallScore >= 0.8 ? 'Very High' : overallScore >= 0.6 ? 'High' : 'Moderate'}
        </h3>

        <div className="space-y-3">
          <ScoreBar label="engagement cues" value={scores.engagement} />
          <ScoreBar label="trend alignment" value={scores.trend} />
          <ScoreBar label="content novelty" value={scores.novelty} />
          <ScoreBar label="production quality" value={scores.quality} />
          <ScoreBar label="audience match" value={scores.audience} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Analysis Reasoning</h3>
        <p className="text-gray-300 whitespace-pre-wrap">{reasoning}</p>
      </div>

      {citations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Similar Content</h3>
          <MediaGrid 
            citations={citations.filter(citation => citation.url && (citation.thumbnail || citation.type))} 
            className="mb-6"
          />
          <div className="space-y-2">
            {citations
              .filter(citation => !citation.thumbnail && !citation.type)
              .map((citation, index) => (
                <div key={index} className="text-sm text-gray-400">
                  [{index + 1}] {citation.url || citation}
                </div>
              ))
            }
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium mb-2">Video Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <DetailBox label="Duration" value={videoDetails.duration} />
          <DetailBox label="Resolution" value={videoDetails.resolution} />
          <DetailBox label="FPS" value={videoDetails.fps.toString()} />
          <DetailBox label="Format" value={videoDetails.format.toUpperCase()} />
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-blue-400"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-800/50 rounded-lg">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
} 