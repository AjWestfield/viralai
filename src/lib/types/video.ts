import { MediaCitation } from '../services/media-enricher';

export interface VideoMetadata {
  duration: number;
  format: string;
  size: number;
  bitrate: string;
  video: {
    codec: string;
    width: number;
    height: number;
    fps: number;
  };
  audio: {
    codec: string;
    channels: number;
    sampleRate: number;
  };
}

export interface AnalysisResult {
  engagementCues: number;
  trendAlignment: number;
  contentNovelty: number;
  productionQuality: number;
  audienceMatch: number;
  score: number;
}

export interface ProcessingStatus {
  stage: 'uploading' | 'preprocessing' | 'analyzing' | 'complete';
  progress: number;
  currentStep?: string;
  error?: string;
}

export interface VideoAnalysis {
  metadata: VideoMetadata;
  result: AnalysisResult;
  status: ProcessingStatus;
  timestamp: string;
  reasoning: string;
  citations: string[];
  enrichedCitations: MediaCitation[];
} 