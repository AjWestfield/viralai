import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { FFmpegService } from '@/services';
import { calculateViralPotential } from '@/lib/analysis/viralScore';
import { VideoAnalysis } from '@/lib/types/video';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const FRAMES_DIR = join(process.cwd(), 'frames');

// Ensure directories exist
async function ensureDirectories() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
  if (!existsSync(FRAMES_DIR)) {
    await mkdir(FRAMES_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure upload directories exist
    await ensureDirectories();

    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload MP4, MOV, or AVI file.' },
        { status: 400 }
      );
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    // Save video file
    const buffer = Buffer.from(await file.arrayBuffer());
    const videoPath = join(UPLOAD_DIR, `${Date.now()}-${file.name}`);
    await writeFile(videoPath, buffer);

    try {
      // Get video metadata
      const metadata = await FFmpegService.getVideoMetadata(videoPath);

      // For now, return mock analysis data with real metadata
      const mockAnalysis: VideoAnalysis = {
        metadata,
        result: {
          engagementCues: 0.8,
          trendAlignment: 0.7,
          contentNovelty: 0.9,
          productionQuality: 0.85,
          audienceMatch: 0.75,
          score: 0.82
        },
        status: {
          stage: 'complete',
          progress: 100
        },
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(mockAnalysis);
    } catch (error) {
      console.error('Error analyzing video:', error);
      return NextResponse.json(
        { error: 'Failed to analyze video. Please ensure the file is a valid video.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 