import { spawn } from 'child_process';
import { join } from 'path';
import { mkdir, existsSync } from 'fs';
import { promisify } from 'util';

const mkdirAsync = promisify(mkdir);
const THUMBNAILS_DIR = join(process.cwd(), 'public', 'thumbnails');

export class FFmpegService {
  static async extractFrames(videoPath: string, outputPath: string, fps: number = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vf', `fps=${fps}`,
        '-frame_pts', '1',
        '-f', 'image2',
        `${outputPath}/frame_%d.jpg`
      ]);

      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });
    });
  }

  static async extractThumbnail(videoUrl: string, timestamp: string = '00:00'): Promise<string | undefined> {
    try {
      // Ensure thumbnails directory exists
      if (!existsSync(THUMBNAILS_DIR)) {
        await mkdirAsync(THUMBNAILS_DIR, { recursive: true });
      }

      // Generate unique filename for the thumbnail
      const thumbnailFilename = `${Date.now()}.jpg`;
      const outputPath = join(THUMBNAILS_DIR, thumbnailFilename);
      const relativePath = `/thumbnails/${thumbnailFilename}`;

      // For YouTube URLs, use their thumbnail API
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = this.extractYouTubeId(videoUrl);
        if (videoId) {
          return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }

      // For TikTok URLs, try to extract the video ID and use their thumbnail API
      if (videoUrl.includes('tiktok.com')) {
        // TikTok requires authentication for their API, so we'll need to use FFmpeg
        console.log('Processing TikTok URL:', videoUrl);
      }

      // For direct video URLs, use FFmpeg
      return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-ss', timestamp,
          '-i', videoUrl,
          '-vframes', '1',
          '-q:v', '2',
          outputPath
        ]);

        let error = '';
        ffmpeg.stderr.on('data', (data) => {
          error += data.toString();
          console.log('FFmpeg thumbnail:', data.toString());
        });

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            resolve(relativePath);
          } else {
            console.error('Failed to generate thumbnail:', error);
            reject(new Error(`FFmpeg thumbnail process exited with code ${code}`));
          }
        });
      });
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return undefined;
    }
  }

  private static extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu.be\/)([^&\n?#]+)/,
      /youtube.com\/embed\/([^&\n?#]+)/,
      /youtube.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  static async getVideoMetadata(videoPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    format: string;
  }> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath
      ]);

      let output = '';

      ffprobe.stdout.on('data', (data) => {
        output += data;
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const metadata = JSON.parse(output);
            const videoStream = metadata.streams.find(
              (stream: any) => stream.codec_type === 'video'
            );

            resolve({
              duration: parseFloat(metadata.format.duration),
              width: videoStream.width,
              height: videoStream.height,
              fps: eval(videoStream.r_frame_rate),
              format: metadata.format.format_name.split(',')[0]
            });
          } catch (error) {
            reject(new Error('Failed to parse video metadata'));
          }
        } else {
          reject(new Error(`FFprobe process exited with code ${code}`));
        }
      });
    });
  }
} 