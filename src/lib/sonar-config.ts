import OpenAI from 'openai';

export const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PPLX_KEY;
export const PERPLEXITY_API_URL = 'https://api.perplexity.ai';

export const perplexityClient = new OpenAI({
  apiKey: PERPLEXITY_API_KEY,
  baseURL: PERPLEXITY_API_URL
}); 