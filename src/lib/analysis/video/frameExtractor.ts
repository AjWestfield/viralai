import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import path from 'path';

interface FrameExtractorOptions {
  interval?: number;
  outputDir: string;
  maxFrames?: number;
}

export class FrameExtractor {
  private options: Required<FrameExtractorOptions>;

  constructor(options: FrameExtractorOptions) {
    this.options = {
      interval: options.interval || 2,
      maxFrames: options.maxFrames || 30,
      outputDir: options.outputDir
    };
  }

  async extractFrames(videoPath: string): Promise<string[]> {
    const outputFrames: string[] = [];
    
    return new Promise((resolve, reject) => {
      const outputPattern = path.join(this.options.outputDir, 'frame_%d.jpg');
      
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vf', `fps=1/${this.options.interval}`,
        '-frame_pts', '1',
        '-vframes', this.options.maxFrames.toString(),
        '-f', 'image2',
        outputPattern
      ]);

      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          // Generate frame paths
          for (let i = 1; i <= this.options.maxFrames; i++) {
            outputFrames.push(path.join(this.options.outputDir, `frame_${i}.jpg`));
          }
          resolve(outputFrames);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
      });
    });
  }

  async extractKeyFrames(videoPath: string): Promise<string[]> {
    const outputFrames: string[] = [];
    
    return new Promise((resolve, reject) => {
      const outputPattern = path.join(this.options.outputDir, 'keyframe_%d.jpg');
      
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vf', 'select=eq(pict_type\\,I)',
        '-vsync', 'vfr',
        '-frame_pts', '1',
        '-vframes', this.options.maxFrames.toString(),
        '-f', 'image2',
        outputPattern
      ]);

      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          // Generate frame paths
          for (let i = 1; i <= this.options.maxFrames; i++) {
            outputFrames.push(path.join(this.options.outputDir, `keyframe_${i}.jpg`));
          }
          resolve(outputFrames);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
      });
    });
  }

  async extractAudio(videoPath: string): Promise<string> {
    const audioOutput = path.join(this.options.outputDir, 'audio.wav');
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        audioOutput
      ]);

      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(audioOutput);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
      });
    });
  }
} 