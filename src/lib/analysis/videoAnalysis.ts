import { perplexityClient, analyzeWithMedia } from '../sonar-config';
import { VideoMetadata } from '../types/video';
import { enrichCitations } from '../services/media-enricher';

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
function extractJsonFromResponse(response: string): any {
  try {
    // Find JSON content between triple backticks if it exists
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // If no JSON in backticks, try to find any JSON object in the response
    const jsonRegex = /{[\s\S]*?}/;
    const match = response.match(jsonRegex);
    if (match) {
      return JSON.parse(match[0]);
    }
    
    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('Error extracting JSON:', error);
    console.error('Raw response:', response);
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
  enrichedCitations: any[];
  reasoning: string;
}> {
  try {
    console.log('Starting video analysis with Perplexity AI (sonar-reasoning-pro)...');
    console.log('Video metadata:', JSON.stringify(videoData.metadata, null, 2));

    // First, get similar content analysis with media citations
    const similarContentResponse = await analyzeWithMedia(
      `Find and analyze 5 similar viral videos that match these characteristics:
       - Duration: ${videoData.metadata.duration}s
       - Resolution: ${videoData.metadata.video.width}x${videoData.metadata.video.height}
       - Format: ${videoData.metadata.format}
       
       For each video found, you MUST provide:
       1. Direct video URL (preferably TikTok, Instagram, or YouTube)
       2. Preview image/thumbnail URL
       3. Timestamp in the format "MM:SS"
       4. Brief description explaining why it's similar
       5. Type (must be either "video" or "image")
       
       Return ONLY a JSON response in this exact format:
       {
         "mediaCitations": [
           {
             "url": "string (direct video/image URL)",
             "thumbnail": "string (direct thumbnail URL)",
             "timestamp": "string (MM:SS format)",
             "type": "video",
             "description": "string (1-2 sentences)"
           }
         ]
       }
       
       Focus on finding viral content from the past 6 months that has similar characteristics.
       Do not include any explanatory text or thinking process, ONLY the JSON response.`
    );

    // Extract media citations from the response
    let mediaCitations = [];
    try {
      const jsonResponse = extractJsonFromResponse(similarContentResponse.choices[0].message.content);
      if (jsonResponse?.mediaCitations) {
        mediaCitations = jsonResponse.mediaCitations.map(citation => ({
          url: citation.url,
          type: citation.type || 'video',
          timestamp: citation.timestamp,
          thumbnail: citation.thumbnail,
          description: citation.description
        }));
      }
    } catch (error) {
      console.error('Failed to extract media citations:', error);
    }

    // Analyze metadata using Perplexity AI with reasoning
    const metadataResponse = await perplexityClient.chat.completions.create({
      model: 'sonar-reasoning-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a video analysis expert. Analyze the video metadata and provide scores and insights about its potential viral factors. Return ONLY a JSON response with this structure: {"trendScore": number 0-1, "noveltyScore": number 0-1, "qualityScore": number 0-1, "audienceScore": number 0-1, "analysis": "string", "reasoning": "string"}'
        },
        {
          role: 'user',
          content: `Analyze this video metadata and provide insights about its potential viral factors. Consider factors like duration, resolution, format, and technical quality: ${JSON.stringify(videoData.metadata)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: "text" }
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
          content: 'You are a viral content prediction expert. Calculate viral potential scores based on video analysis. Use chain-of-thought reasoning to explain your predictions. Return your analysis in JSON format with the following structure: {"score": number 0-1, "reasoning": "string", "explanation": "string", "citations": ["string"]}'
        },
        {
          role: 'user',
          content: `Based on this detailed analysis and similar content examples, calculate a viral potential score and provide chain-of-thought reasoning for your prediction: ${JSON.stringify({
            metadata: metadataContent,
            similarContent: similarContentResponse.choices[0].message.content
          })}`
        }
      ],
      temperature: 0.5,
      max_tokens: 8000,
      response_format: { type: "text" }
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

    // Extract all citations
    const allCitations = [
      ...(metadataContent.citations || []),
      ...(viralContent.citations || [])
    ];

    // Combine text citations with media citations
    const enrichedCitations = [
      ...mediaCitations,
      ...(await enrichCitations(allCitations))
    ];

    const combinedReasoning = [
      metadataContent.reasoning || '',
      viralContent.explanation || '',
      viralContent.reasoning,
      extractReasoningFromResponse(similarContentResponse)
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
      enrichedCitations,
      reasoning: combinedReasoning
    };
  } catch (error) {
    console.error('Video analysis failed:', error);
    throw error;
  }
}

function extractCitationsFromResponse(response: any): string[] {
  try {
    // First try to get citations from the choices array
    if (response?.choices?.[0]?.message?.content) {
      const jsonData = extractJsonFromResponse(response.choices[0].message.content);
      if (jsonData?.citations) {
        return jsonData.citations;
      }
    }
    
    // If no citations in the JSON, try to get them from the response object directly
    if (response?.citations && Array.isArray(response.citations)) {
      return response.citations;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to extract citations:', error);
    return [];
  }
}

function extractReasoningFromResponse(response: any): string {
  try {
    if (response?.choices?.[0]?.message?.content) {
      const jsonData = extractJsonFromResponse(response.choices[0].message.content);
      return jsonData?.reasoning || jsonData?.explanation || '';
    }
    return '';
  } catch (error) {
    console.error('Failed to extract reasoning:', error);
    return '';
  }
} 