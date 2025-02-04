import path from 'path';
import { promises as fs } from 'fs';
import { FrameExtractor } from './video/frameExtractor';
import { FeatureExtractor, FrameFeatures } from './video/featureExtractor';
import { SpeechAnalyzer, AudioFeatures } from './audio/speechAnalyzer';
import { SonarClient } from '../sonar-config';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
}

export interface AnalysisResult {
  metadata: VideoMetadata;
  features: {
    frames: FrameFeatures[];
    audio: AudioFeatures;
  };
  viralScore: {
    overall: number;
    engagement: number;
    trend: number;
    quality: number;
    audience: number;
  };
  reasoning: string;
  citations: { url: string; title: string; }[];
}

export class VideoAnalyzer {
  private frameExtractor: FrameExtractor;
  private featureExtractor: FeatureExtractor;
  private speechAnalyzer: SpeechAnalyzer;
  private sonarClient: SonarClient;
  private workDir: string;

  constructor(
    workDir: string,
    modelPath: string,
    sonarApiKey: string
  ) {
    this.workDir = workDir;
    this.frameExtractor = new FrameExtractor({ outputDir: path.join(workDir, 'frames') });
    this.featureExtractor = new FeatureExtractor();
    this.speechAnalyzer = new SpeechAnalyzer(modelPath);
    this.sonarClient = new SonarClient(sonarApiKey);
  }

  async initialize() {
    await fs.mkdir(this.workDir, { recursive: true });
    await fs.mkdir(path.join(this.workDir, 'frames'), { recursive: true });
    await this.featureExtractor.initialize();
    await this.speechAnalyzer.initialize();
  }

  async analyzeVideo(
    videoPath: string, 
    onProgress?: (progress: number, currentStep: string) => void
  ): Promise<AnalysisResult> {
    try {
      // Extract frames and audio
      onProgress?.(10, 'Extracting video frames...');
      const framePaths = await this.frameExtractor.extractFrames(videoPath);
      
      onProgress?.(20, 'Extracting audio...');
      const audioPath = await this.frameExtractor.extractAudio(videoPath);

      // Process frames in parallel
      onProgress?.(30, 'Analyzing visual features...');
      const frameFeatures = await this.featureExtractor.extractBatchFeatures(framePaths);

      // Process audio
      onProgress?.(50, 'Analyzing audio content...');
      const audioFeatures = await this.speechAnalyzer.analyzeAudio(audioPath);

      // Get video metadata
      const metadata = await this.getVideoMetadata(videoPath);

      // Prepare analysis prompt
      onProgress?.(70, 'Generating viral analysis...');
      const analysisPrompt = this.prepareAnalysisPrompt(metadata, frameFeatures, audioFeatures);

      // Get Sonar analysis
      const sonarResponse = await this.sonarClient.analyze(analysisPrompt);
      
      // Parse response
      const { score, reasoning, citations } = this.parseSonarResponse(sonarResponse);

      onProgress?.(100, 'Analysis complete!');

      // Return complete analysis
      return {
        metadata,
        features: {
          frames: frameFeatures,
          audio: audioFeatures
        },
        viralScore: score,
        reasoning,
        citations
      };

    } catch (error) {
      console.error('Video analysis error:', error);
      throw error;
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  private async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    // Implementation remains the same
    return {
      duration: 0,
      width: 0,
      height: 0,
      fps: 0,
      format: ''
    };
  }

  private prepareAnalysisPrompt(
    metadata: VideoMetadata,
    frameFeatures: FrameFeatures[],
    audioFeatures: AudioFeatures
  ): string {
    return JSON.stringify({
      metadata,
      visualFeatures: frameFeatures.map(f => ({
        timestamp: f.timestamp,
        objects: f.objects.map(o => o.class),
        text: f.text
      })),
      audioFeatures: {
        transcript: audioFeatures.transcript.map(t => t.text).join(' '),
        language: audioFeatures.language
      }
    });
  }

  private parseSonarResponse(response: any) {
    // Extract score, reasoning, and citations from Sonar response
    return {
      score: {
        overall: 0.5,
        engagement: 0.5,
        trend: 0.5,
        quality: 0.5,
        audience: 0.5
      },
      reasoning: '',
      citations: []
    };
  }

  private async cleanup() {
    await this.featureExtractor.cleanup();
    await this.speechAnalyzer.cleanup();
    // Cleanup temporary files
    try {
      await fs.rm(this.workDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
} 