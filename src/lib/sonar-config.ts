import OpenAI from 'openai';

const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityResponse {
  id: string;
  choices: Array<{
    finish_reason: string;
    index: number;
    message: {
      role: string;
      content: string;
    };
  }>;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function analyzeWithMedia(prompt: string): Promise<PerplexityResponse> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key is not configured');
  }

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a viral content analysis expert using Perplexity Sonar Reasoning Pro. 
      Analyze content for viral potential considering:
      - Engagement factors
      - Trend alignment
      - Content novelty
      - Production quality
      - Target audience match
      Provide detailed reasoning and specific recommendations.`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-reasoning-pro',
        messages,
        max_tokens: 8000,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error: ${error}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw error;
  }
} 