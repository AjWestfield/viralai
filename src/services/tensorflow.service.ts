import * as tf from '@tensorflow/tfjs';

export class TensorFlowService {
  private static model: tf.LayersModel | null = null;

  static async loadModel(modelPath: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(modelPath);
    } catch (error) {
      throw new Error(`Failed to load TensorFlow model: ${error}`);
    }
  }

  static async analyzeFrame(imageData: ImageData): Promise<{
    engagementScore: number;
    contentScore: number;
  }> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    try {
      // Convert image data to tensor
      const tensor = tf.browser.fromPixels(imageData);
      const resized = tf.image.resizeBilinear(tensor, [224, 224]);
      const expanded = resized.expandDims(0);
      const normalized = expanded.div(255.0);

      // Run inference
      const predictions = this.model.predict(normalized) as tf.Tensor;
      const scores = await predictions.array();

      // Cleanup
      tensor.dispose();
      resized.dispose();
      expanded.dispose();
      normalized.dispose();
      predictions.dispose();

      return {
        engagementScore: scores[0][0],
        contentScore: scores[0][1]
      };
    } catch (error) {
      throw new Error(`Failed to analyze frame: ${error}`);
    }
  }

  static async predictViralPotential(features: number[]): Promise<number> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    try {
      const inputTensor = tf.tensor2d([features], [1, features.length]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const score = (await prediction.array())[0][0];

      // Cleanup
      inputTensor.dispose();
      prediction.dispose();

      return score;
    } catch (error) {
      throw new Error(`Failed to predict viral potential: ${error}`);
    }
  }

  static dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
} 