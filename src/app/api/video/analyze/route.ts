import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { FFmpegService } from '@/services';
import { analyzeVideoContent } from '@/lib/analysis/videoAnalysis';
import { VideoAnalysis } from '@/lib/types/video';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
async function ensureDirectories() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    return false;
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    maxDuration: 300,
  },
};

export async function POST(request: NextRequest) {
  console.log('Starting video analysis request...');
  
  try {
    const dirCreated = await ensureDirectories();
    if (!dirCreated) {
      return NextResponse.json(
        { error: 'Failed to initialize upload directory' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('video') as File;
    
    if (!file) {
      console.error('No video file provided');
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    console.log('Received video file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Please upload MP4, MOV, or AVI file.' },
        { status: 400 }
      );
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileName = `video_${Date.now()}.mp4`;
    const filePath = join(UPLOAD_DIR, fileName);

    // Save the file
    console.log('Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log('Saving file to:', filePath);
    await writeFile(filePath, buffer);

    // Get video metadata using FFmpeg
    console.log('Getting video metadata...');
    const metadata = await FFmpegService.getVideoMetadata(filePath);
    console.log('Video metadata:', metadata);

    // Start content analysis
    console.log('Starting content analysis...');
    const analysis = await analyzeVideoContent({
      metadata: {
        duration: metadata.duration,
        format: metadata.format,
        size: buffer.length,
        bitrate: '0',
        video: {
          codec: 'unknown',
          width: metadata.width,
          height: metadata.height,
          fps: metadata.fps
        },
        audio: {
          codec: 'unknown',
          channels: 2,
          sampleRate: 44100
        }
      },
      frames: []
    });

    // Transform the analysis into the expected format
    const transformedAnalysis = {
      metadata: {
        duration: metadata.duration,
        format: metadata.format,
        size: buffer.length,
        bitrate: '0',
        video: {
          codec: 'unknown',
          width: metadata.width,
          height: metadata.height,
          fps: metadata.fps
        },
        audio: {
          codec: 'unknown',
          channels: 2,
          sampleRate: 44100
        }
      },
      result: {
        engagementCues: analysis.metadata.choices[0].message.content.trendScore,
        trendAlignment: analysis.metadata.choices[0].message.content.trendScore,
        contentNovelty: analysis.metadata.choices[0].message.content.noveltyScore,
        productionQuality: analysis.metadata.choices[0].message.content.qualityScore,
        audienceMatch: analysis.metadata.choices[0].message.content.audienceScore,
        score: analysis.viralScore.choices[0].message.content.score
      },
      status: {
        stage: 'complete',
        progress: 100,
        currentStep: 'Analysis complete!'
      },
      timestamp: new Date().toISOString(),
      reasoning: analysis.reasoning,
      citations: analysis.citations,
      enrichedCitations: analysis.enrichedCitations || [],
      videoPath: fileName
    };

    console.log('Analysis complete, sending response...');
    return NextResponse.json({
      success: true,
      ...transformedAnalysis
    });

  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 500 }
    );
  }
} 