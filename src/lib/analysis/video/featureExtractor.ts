import { createWorker } from 'tesseract.js';
import * as tf from '@tensorflow/tfjs-node';
import { load } from '@tensorflow-models/coco-ssd';
import { promises as fs } from 'fs';

export interface DetectedObject {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

export interface FrameFeatures {
  text: string;
  objects: DetectedObject[];
  timestamp: number;
}

export class FeatureExtractor {
  private objectDetector: any;
  private ocrWorker: Tesseract.Worker;
  private initialized: boolean = false;

  async initialize() {
    if (this.initialized) return;

    // Initialize Tesseract OCR
    this.ocrWorker = await createWorker('eng');

    // Initialize TensorFlow object detection
    this.objectDetector = await load();

    this.initialized = true;
  }

  async extractFeatures(framePath: string, timestamp: number): Promise<FrameFeatures> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Read the image file
    const imageBuffer = await fs.readFile(framePath);
    const image = await tf.node.decodeImage(imageBuffer);

    // Perform OCR
    const { data: { text } } = await this.ocrWorker.recognize(framePath);

    // Perform object detection
    const predictions = await this.objectDetector.detect(image as any);

    // Convert predictions to our format
    const objects: DetectedObject[] = predictions.map((pred: any) => ({
      bbox: pred.bbox,
      class: pred.class,
      score: pred.score
    }));

    // Clean up tensor
    (image as any).dispose();

    return {
      text,
      objects,
      timestamp
    };
  }

  async extractBatchFeatures(framePaths: string[]): Promise<FrameFeatures[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const features: FrameFeatures[] = [];
    
    for (let i = 0; i < framePaths.length; i++) {
      const timestamp = i * 1000; // Assuming 1 second intervals
      const frameFeatures = await this.extractFeatures(framePaths[i], timestamp);
      features.push(frameFeatures);
    }

    return features;
  }

  async cleanup() {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
    }
  }

  private async preprocessImage(imagePath: string): Promise<tf.Tensor3D> {
    const imageBuffer = await fs.readFile(imagePath);
    const tensor = await tf.node.decodeImage(imageBuffer);
    return tensor as tf.Tensor3D;
  }

  private async detectText(imagePath: string): Promise<string> {
    const { data: { text } } = await this.ocrWorker.recognize(imagePath);
    return text;
  }

  private async detectObjects(tensor: tf.Tensor3D): Promise<DetectedObject[]> {
    const predictions = await this.objectDetector.detect(tensor);
    return predictions.map((pred: any) => ({
      bbox: pred.bbox,
      class: pred.class,
      score: pred.score
    }));
  }
} 