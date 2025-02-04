import { AnalysisResult } from '../types/video';

const WEIGHTS = {
  engagementCues: 0.3,
  trendAlignment: 0.25,
  contentNovelty: 0.2,
  productionQuality: 0.15,
  audienceMatch: 0.1
};

export const calculateViralPotential = (metrics: Omit<AnalysisResult, 'score'>): number => {
  const weightedScores = Object.entries(metrics).map(([key, value]) => {
    const weight = WEIGHTS[key as keyof typeof WEIGHTS] || 0;
    return value * weight;
  });

  const totalScore = weightedScores.reduce((sum, score) => sum + score, 0);
  
  // Normalize to 0-1 range
  return Math.min(Math.max(totalScore, 0), 1);
};

export const getScoreCategory = (score: number): string => {
  if (score >= 0.8) return 'Viral Potential: Very High';
  if (score >= 0.6) return 'Viral Potential: High';
  if (score >= 0.4) return 'Viral Potential: Medium';
  if (score >= 0.2) return 'Viral Potential: Low';
  return 'Viral Potential: Very Low';
};

export const getScoreColor = (score: number): string => {
  if (score >= 0.8) return 'text-green-500';
  if (score >= 0.6) return 'text-green-400';
  if (score >= 0.4) return 'text-yellow-500';
  if (score >= 0.2) return 'text-orange-500';
  return 'text-red-500';
}; 