import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

// List of supported domains
const SUPPORTED_DOMAINS = [
  'youtube.com', 'youtu.be',
  'tiktok.com',
  'instagram.com',
  'facebook.com', 'fb.com',
  'twitter.com', 'x.com',
  'vimeo.com'
];

function isValidVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return SUPPORTED_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

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

export async function POST(request: NextRequest) {
  try {
    const dirCreated = await ensureDirectories();
    if (!dirCreated) {
      return NextResponse.json(
        { error: 'Failed to initialize upload directory' },
        { status: 500 }
      );
    }

    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    if (!isValidVideoUrl(url)) {
      return NextResponse.json(
        { 
          error: 'Invalid or unsupported video URL',
          message: `URL must be from one of these platforms: ${SUPPORTED_DOMAINS.join(', ')}` 
        },
        { status: 400 }
      );
    }

    console.log('Starting video URL analysis request...');
    console.log('Video URL:', url);

    // Generate a unique filename using timestamp
    const timestamp = Date.now();
    const outputPath = join(UPLOAD_DIR, `video_${timestamp}.mp4`);

    // Construct the yt-dlp command with better format selection
    // Using best video+audio format that can be merged into mp4
    const command = `yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b" --merge-output-format mp4 "${url}" -o "${outputPath}" --no-playlist --no-warnings`;
    
    console.log('Executing command:', command);
    
    try {
      // Execute yt-dlp command with timeout
      const { stdout, stderr } = await execAsync(command, { timeout: 300000 }); // 5 minute timeout
      console.log('stdout:', stdout);
      if (stderr) console.error('stderr:', stderr);

      // Check if the file was downloaded successfully
      if (!existsSync(outputPath)) {
        throw new Error('Failed to download video - output file not found');
      }

      console.log('Video downloaded to:', outputPath);

      return NextResponse.json({
        success: true,
        videoPath: `video_${timestamp}.mp4`
      });
    } catch (execError) {
      console.error('Error executing yt-dlp:', execError);
      throw new Error(`Failed to download video: ${execError.message}`);
    }

  } catch (error) {
    console.error('Error downloading video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to download video';
    
    return NextResponse.json(
      { 
        error: 'Failed to download video from the provided URL',
        message: 'Please ensure the URL is accessible and contains a valid video',
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 