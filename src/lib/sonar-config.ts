import { env } from '@/env.mjs';

export const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PPLX_KEY;
export const PERPLEXITY_API_URL = 'https://api.perplexity.ai';

export const sonarConfig = {
  apiKey: PERPLEXITY_API_KEY,
  baseURL: PERPLEXITY_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
  }
}; 