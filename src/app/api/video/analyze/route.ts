import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { FFmpegService } from '@/services';
import { analyzeVideoContent } from '@/lib/analysis/videoAnalysis';
import { VideoAnalysis } from '@/lib/types/video';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

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

    try {
      console.log('Converting file to buffer...');
      const buffer = Buffer.from(await file.arrayBuffer());
      const videoPath = join(UPLOAD_DIR, `${Date.now()}-${file.name}`);
      
      console.log('Saving file to:', videoPath);
      await writeFile(videoPath, buffer);

      console.log('Getting video metadata...');
      const metadata = await FFmpegService.getVideoMetadata(videoPath);
      console.log('Video metadata:', metadata);

      console.log('Starting content analysis...');
      const analysisResult = await analyzeVideoContent({
        metadata: {
          duration: metadata.duration,
          format: metadata.format,
          size: file.size,
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

      console.log('Analysis complete, preparing response...');
      const response: VideoAnalysis = {
        metadata: {
          duration: metadata.duration,
          format: metadata.format,
          size: file.size,
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
          engagementCues: analysisResult.viralScore.choices[0].message.content.score,
          trendAlignment: analysisResult.metadata.choices[0].message.content.trendScore,
          contentNovelty: analysisResult.metadata.choices[0].message.content.noveltyScore,
          productionQuality: analysisResult.metadata.choices[0].message.content.qualityScore,
          audienceMatch: analysisResult.metadata.choices[0].message.content.audienceScore,
          score: analysisResult.viralScore.choices[0].message.content.score
        },
        status: {
          stage: 'complete',
          progress: 100,
          currentStep: 'Analysis complete!'
        },
        timestamp: new Date().toISOString(),
        reasoning: analysisResult.reasoning,
        citations: analysisResult.citations,
        enrichedCitations: analysisResult.enrichedCitations
      };

      // Create a TransformStream to stream the response
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();

      // Write the response in chunks
      const chunks = [
        { progress: 95, currentStep: 'Processing analysis results...' },
        { progress: 98, currentStep: 'Finalizing media citations...' },
        { ...response, progress: 100, currentStep: 'Analysis complete!' }
      ];

      // Stream the chunks with delays
      (async () => {
        for (const chunk of chunks) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await writer.write(encoder.encode(JSON.stringify(chunk) + '\n'));
        }
        await writer.close();
      })();

      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Transfer-Encoding': 'chunked'
        }
      });

    } catch (error) {
      console.error('Analysis error:', error);
      return NextResponse.json(
        { error: 'Failed to analyze video' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 