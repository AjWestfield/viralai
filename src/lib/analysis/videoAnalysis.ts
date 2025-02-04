import { sonarConfig } from '../sonar-config';
import { VideoMetadata } from '../types/video';

interface AnalysisResponse {
  metadata: any;
  viralScore: any;
  citations?: any[];
}

export async function analyzeVideoContent(videoData: {
  metadata: VideoMetadata;
  frames: string[];
}): Promise<AnalysisResponse> {
  try {
    // Analyze metadata using Sonar Pro
    const metadataResponse = await fetch(`${sonarConfig.baseURL}/chat/completions`, {
      method: 'POST',
      headers: sonarConfig.headers,
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{
          role: 'user',
          content: `Analyze this video metadata and provide insights about its potential viral factors: ${JSON.stringify(videoData.metadata)}`
        }],
        max_tokens: 4000,
        temperature: 0.3
      })
    });

    if (!metadataResponse.ok) {
      throw new Error(`Metadata analysis failed: ${metadataResponse.statusText}`);
    }

    const metadataAnalysis = await metadataResponse.json();

    // Calculate viral potential using Sonar Reasoning Pro
    const viralResponse = await fetch(`${sonarConfig.baseURL}/chat/completions`, {
      method: 'POST',
      headers: sonarConfig.headers,
      body: JSON.stringify({
        model: 'sonar-reasoning-pro',
        messages: [{
          role: 'user',
          content: `Based on this analysis, calculate a viral potential score and provide detailed reasoning: ${metadataAnalysis.choices[0].message.content}`
        }],
        max_tokens: 8000,
        temperature: 0.5
      })
    });

    if (!viralResponse.ok) {
      throw new Error(`Viral analysis failed: ${viralResponse.statusText}`);
    }

    const viralAnalysis = await viralResponse.json();

    return {
      metadata: metadataAnalysis,
      viralScore: viralAnalysis,
      citations: viralAnalysis.experimental_providerMetadata?.citations || []
    };
  } catch (error) {
    console.error('Video analysis failed:', error);
    throw new Error('Video analysis service unavailable');
  }
} 