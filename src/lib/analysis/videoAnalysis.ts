import { perplexityClient } from '../sonar-config';
import { VideoMetadata } from '../types/video';

interface MetadataContent {
  trendScore: number;
  noveltyScore: number;
  qualityScore: number;
  audienceScore: number;
  analysis: string;
  citations?: string[];
  reasoning?: string;
}

interface ViralContent {
  score: number;
  reasoning: string;
  citations?: string[];
  explanation?: string;
}

// Helper function to extract JSON from response
function extractJsonFromResponse(content: string): any {
  try {
    // Find JSON content between triple backticks if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // If no triple backticks, try to find content between curly braces
    const braceMatch = content.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      return JSON.parse(braceMatch[0]);
    }
    
    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('Error extracting JSON:', error);
    throw new Error('Failed to extract valid JSON from response');
  }
}

export async function analyzeVideoContent(videoData: {
  metadata: VideoMetadata;
  frames: string[];
}): Promise<{
  metadata: { choices: Array<{ message: { content: MetadataContent } }> };
  viralScore: { choices: Array<{ message: { content: ViralContent } }> };
  citations: string[];
  reasoning: string;
}> {
  try {
    console.log('Starting video analysis with Perplexity AI (sonar-reasoning-pro)...');
    console.log('Video metadata:', JSON.stringify(videoData.metadata, null, 2));

    // Analyze metadata using Perplexity AI with reasoning
    const metadataResponse = await perplexityClient.chat.completions.create({
      model: 'sonar-reasoning-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a video analysis expert. Analyze the video metadata and provide scores and insights about its potential viral factors. Use chain-of-thought reasoning to explain your analysis. Return ONLY a JSON object without any additional text, in this format: {"trendScore": number 0-1, "noveltyScore": number 0-1, "qualityScore": number 0-1, "audienceScore": number 0-1, "analysis": "string explanation", "reasoning": "detailed chain of thought", "citations": ["string"]}'
        },
        {
          role: 'user',
          content: `Analyze this video metadata and provide insights about its potential viral factors. Consider factors like duration, resolution, format, and technical quality: ${JSON.stringify(videoData.metadata)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 8000
    });

    console.log('Metadata Analysis Response:', JSON.stringify(metadataResponse, null, 2));

    let metadataContent: MetadataContent;
    try {
      metadataContent = extractJsonFromResponse(metadataResponse.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse metadata response:', parseError);
      console.error('Raw content:', metadataResponse.choices[0].message.content);
      throw new Error('Failed to parse metadata response');
    }

    // Calculate viral potential using Perplexity AI with reasoning
    const viralResponse = await perplexityClient.chat.completions.create({
      model: 'sonar-reasoning-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a viral content prediction expert. Calculate viral potential scores based on video analysis. Use chain-of-thought reasoning to explain your predictions. Return ONLY a JSON object without any additional text, in this format: {"score": number 0-1, "reasoning": "string explanation", "explanation": "detailed chain of thought analysis", "citations": ["string"]}'
        },
        {
          role: 'user',
          content: `Based on this detailed analysis, calculate a viral potential score and provide chain-of-thought reasoning for your prediction: ${JSON.stringify(metadataContent)}`
        }
      ],
      temperature: 0.5,
      max_tokens: 8000
    });

    console.log('Viral Analysis Response:', JSON.stringify(viralResponse, null, 2));

    let viralContent: ViralContent;
    try {
      viralContent = extractJsonFromResponse(viralResponse.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse viral response:', parseError);
      console.error('Raw content:', viralResponse.choices[0].message.content);
      throw new Error('Failed to parse viral response');
    }

    // Combine citations and reasoning from both analyses
    const allCitations = [
      ...(metadataContent.citations || []),
      ...(viralContent.citations || [])
    ];

    const combinedReasoning = [
      metadataContent.reasoning || '',
      viralContent.explanation || '',
      viralContent.reasoning
    ].filter(Boolean).join('\n\n');

    return {
      metadata: {
        choices: [{
          message: {
            content: metadataContent
          }
        }]
      },
      viralScore: {
        choices: [{
          message: {
            content: viralContent
          }
        }]
      },
      citations: allCitations,
      reasoning: combinedReasoning
    };
  } catch (error) {
    console.error('Video analysis failed:', error);
    throw error;
  }
} 