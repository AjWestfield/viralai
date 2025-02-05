import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { FFmpegService } from '@/services';
import { analyzeVideoContent } from '@/lib/analysis/videoAnalysis';
import { VideoAnalysis } from '@/lib/types/video';
import { parseVideoUrl } from '@/lib/utils/videoUrlParser';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);
const UPLOAD_DIR = join(process.cwd(), 'uploads');
const YT_DLP_PATH = '/opt/homebrew/bin/yt-dlp';

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

async function downloadVideo(url: string): Promise<string> {
  try {
    const fileName = `video_${Date.now()}.mp4`;
    const outputPath = join(UPLOAD_DIR, fileName);

    // Construct the yt-dlp command
    const command = [
      YT_DLP_PATH,
      url,
      '--format', 'mp4',
      '--output', outputPath,
      '--no-check-certificates',
      '--no-warnings'
    ].join(' ');

    console.log('Executing command:', command);

    const { stdout, stderr } = await execAsync(command);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);

    // Verify the file was created
    if (!existsSync(outputPath)) {
      throw new Error('Video file was not created after download');
    }

    return fileName;
  } catch (error) {
    console.error('Error downloading video:', error);
    throw new Error(`Failed to download video: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure upload directory exists
    await ensureDirectories();

    // Get URL from request body
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'No video URL provided' },
        { status: 400 }
      );
    }

    console.log('Starting video URL analysis request...');
    console.log('Video URL:', url);

    // Parse video URL and get platform info
    const videoInfo = parseVideoUrl(url);
    
    if (videoInfo.platform === 'unknown') {
      return NextResponse.json(
        { error: 'Unsupported video platform or invalid URL' },
        { status: 400 }
      );
    }

    // Verify yt-dlp exists
    if (!existsSync(YT_DLP_PATH)) {
      return NextResponse.json(
        { error: `yt-dlp not found at ${YT_DLP_PATH}` },
        { status: 500 }
      );
    }

    // Download the video
    const fileName = await downloadVideo(url);
    const videoPath = join(UPLOAD_DIR, fileName);
    console.log('Video downloaded to:', videoPath);

    // Get video metadata using FFmpeg
    console.log('Getting video metadata...');
    const metadata = await FFmpegService.getVideoMetadata(videoPath);
    console.log('Video metadata:', metadata);

    // Start content analysis
    console.log('Starting content analysis...');
    const analysis = await analyzeVideoContent({
      metadata: {
        duration: metadata.duration,
        format: metadata.format,
        size: fs.statSync(videoPath).size,
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
        size: fs.statSync(videoPath).size,
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
      enrichedCitations: analysis.enrichedCitations || []
    };
    
    return NextResponse.json({
      success: true,
      ...transformedAnalysis,
      videoInfo: {
        platform: videoInfo.platform,
        videoId: videoInfo.videoId,
        thumbnailUrl: videoInfo.thumbnailUrl,
        embedUrl: videoInfo.embedUrl
      },
      videoPath: fileName
    });

  } catch (error) {
    console.error('Error processing video URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video URL' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
    maxDuration: 300,
  },
}; 