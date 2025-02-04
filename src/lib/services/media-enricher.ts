import { FFmpegService } from '@/services';

export interface MediaCitation {
  url: string;
  type: 'video' | 'image';
  timestamp?: string;
  thumbnail?: string;
}

export async function enrichCitations(rawCitations: string[]): Promise<MediaCitation[]> {
  return Promise.all(
    rawCitations.map(async (citation) => {
      const mediaType = getMediaType(citation);
      const enrichedCitation: MediaCitation = {
        url: citation,
        type: mediaType,
      };

      if (mediaType === 'video') {
        enrichedCitation.timestamp = await extractVideoTimestamp(citation);
        enrichedCitation.thumbnail = await generateThumbnail(citation);
      }

      return enrichedCitation;
    })
  );
}

function getMediaType(url: string): 'video' | 'image' {
  const videoPatterns = [
    /youtube\.com/,
    /youtu\.be/,
    /vimeo\.com/,
    /\.mp4$/,
    /\.webm$/
  ];
  
  return videoPatterns.some(pattern => pattern.test(url)) ? 'video' : 'image';
}

async function extractVideoTimestamp(url: string): Promise<string> {
  const timeMatch = url.match(/[?&]t=(\d+)s?/);
  if (timeMatch) {
    const seconds = parseInt(timeMatch[1]);
    return formatTimestamp(seconds);
  }
  return '00:00';
}

function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function generateThumbnail(videoUrl: string): Promise<string> {
  try {
    const timestamp = await extractVideoTimestamp(videoUrl);
    return await FFmpegService.extractThumbnail(videoUrl, timestamp);
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return '';
  }
} 