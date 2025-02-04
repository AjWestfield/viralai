import { spawn } from 'child_process';

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