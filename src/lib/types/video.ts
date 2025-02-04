export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
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
  error?: string;
}

export interface VideoAnalysis {
  metadata: VideoMetadata;
  result: AnalysisResult;
  status: ProcessingStatus;
  timestamp: string;
} 