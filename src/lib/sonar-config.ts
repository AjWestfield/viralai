import OpenAI from 'openai';

export const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PPLX_KEY;
export const PERPLEXITY_API_URL = 'https://api.perplexity.ai';

export const perplexityClient = new OpenAI({
  apiKey: PERPLEXITY_API_KEY,
  baseURL: PERPLEXITY_API_URL
});

export async function analyzeWithMedia(prompt: string) {
  return perplexityClient.chat.completions.create({
    model: 'sonar-reasoning-pro',
    messages: [
      {
        role: 'system',
        content: 'You are a media search expert. Find and analyze similar viral content that matches the given characteristics.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: "text" }
  });
} 