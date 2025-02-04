import { analyzeVideoContent } from '../videoAnalysis';
import { VideoMetadata } from '../../types/video';

interface APIError extends Error {
  response?: Response;
}

describe('Video Analysis Integration Test', () => {
  const mockMetadata: VideoMetadata = {
    duration: 120,
    format: 'mp4',
    size: 1024 * 1024 * 10, // 10MB
    bitrate: '2000k',
    video: {
      codec: 'h264',
      width: 1920,
      height: 1080,
      fps: 30,
    },
    audio: {
      codec: 'aac',
      channels: 2,
      sampleRate: 44100,
    }
  };

  const mockFrames = [
    'frame_001.jpg',
    'frame_002.jpg',
    'frame_003.jpg'
  ];

  it('should successfully analyze video content', async () => {
    try {
      const result = await analyzeVideoContent({
        metadata: mockMetadata,
        frames: mockFrames
      });

      console.log('API Response:', JSON.stringify(result, null, 2));

      // Check response structure
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('viralScore');
      
      // Check metadata analysis structure
      expect(result.metadata).toHaveProperty('choices');
      expect(Array.isArray(result.metadata.choices)).toBe(true);
      const metadataChoice = result.metadata.choices[0];
      expect(metadataChoice).toHaveProperty('message');
      expect(metadataChoice.message).toHaveProperty('content');
      
      // Check metadata content structure
      const metadataContent = metadataChoice.message.content;
      console.log('Metadata Content:', metadataContent);
      
      expect(metadataContent).toHaveProperty('trendScore');
      expect(metadataContent).toHaveProperty('noveltyScore');
      expect(metadataContent).toHaveProperty('qualityScore');
      expect(metadataContent).toHaveProperty('audienceScore');
      expect(metadataContent).toHaveProperty('analysis');
      
      expect(typeof metadataContent.trendScore).toBe('number');
      expect(typeof metadataContent.noveltyScore).toBe('number');
      expect(typeof metadataContent.qualityScore).toBe('number');
      expect(typeof metadataContent.audienceScore).toBe('number');
      expect(typeof metadataContent.analysis).toBe('string');
      
      // Validate score ranges
      expect(metadataContent.trendScore).toBeGreaterThanOrEqual(0);
      expect(metadataContent.trendScore).toBeLessThanOrEqual(1);
      expect(metadataContent.noveltyScore).toBeGreaterThanOrEqual(0);
      expect(metadataContent.noveltyScore).toBeLessThanOrEqual(1);
      expect(metadataContent.qualityScore).toBeGreaterThanOrEqual(0);
      expect(metadataContent.qualityScore).toBeLessThanOrEqual(1);
      expect(metadataContent.audienceScore).toBeGreaterThanOrEqual(0);
      expect(metadataContent.audienceScore).toBeLessThanOrEqual(1);
      
      // Check viral score structure
      expect(result.viralScore).toHaveProperty('choices');
      expect(Array.isArray(result.viralScore.choices)).toBe(true);
      const viralChoice = result.viralScore.choices[0];
      expect(viralChoice).toHaveProperty('message');
      expect(viralChoice.message).toHaveProperty('content');
      
      // Check viral score content structure
      const viralContent = viralChoice.message.content;
      console.log('Viral Content:', viralContent);
      
      expect(viralContent).toHaveProperty('score');
      expect(viralContent).toHaveProperty('reasoning');
      expect(typeof viralContent.score).toBe('number');
      expect(typeof viralContent.reasoning).toBe('string');
      
      // Validate viral score range
      expect(viralContent.score).toBeGreaterThanOrEqual(0);
      expect(viralContent.score).toBeLessThanOrEqual(1);
      
      // Optional citations
      if (result.citations) {
        expect(Array.isArray(result.citations)).toBe(true);
      }
    } catch (error) {
      console.error('Test failed with error:', error);
      const apiError = error as APIError;
      if (apiError.response) {
        console.error('API Error Response:', await apiError.response.text());
      }
      throw error;
    }
  }, 60000); // 60 second timeout for API calls
}); 