import { app } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';
import { nodewhisper } from 'nodejs-whisper';

const MODEL_SIZES = {
  'tiny': 75,      // ~75MB
  'tiny.en': 75,
  'base': 142,     // ~142MB
  'base.en': 142,
  'small': 466,    // ~466MB
  'small.en': 466,
  'medium': 1500,  // ~1.5GB
  'medium.en': 1500,
  'large-v1': 2900,// ~2.9GB
  'large': 2900    // ~2.9GB
};

export class ModelManager {
  private modelsDir: string;

  constructor() {
    this.modelsDir = path.join(app.getPath('userData'), 'models');
  }

  async initialize() {
    await fs.mkdir(this.modelsDir, { recursive: true });
  }

  async downloadModel(modelName: string, progressCallback?: (progress: number) => void) {
    try {
      await nodewhisper('' as any, {
        modelName,
        autoDownloadModelName: modelName,
        verbose: true,
        whisperOptions: {
          outputInText: true
        }
      });

      return true;
    } catch (error) {
      console.error('Error downloading model:', error);
      throw error;
    }
  }

  async isModelDownloaded(modelName: string): Promise<boolean> {
    const modelPath = path.join(this.modelsDir, modelName);
    try {
      await fs.access(modelPath);
      return true;
    } catch {
      return false;
    }
  }

  getModelSize(modelName: string): number {
    return MODEL_SIZES[modelName as keyof typeof MODEL_SIZES] || 0;
  }

  async listDownloadedModels(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.modelsDir);
      return files.filter(file => Object.keys(MODEL_SIZES).includes(file));
    } catch {
      return [];
    }
  }

  async deleteModel(modelName: string): Promise<void> {
    const modelPath = path.join(this.modelsDir, modelName);
    try {
      await fs.unlink(modelPath);
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  }
}

export const modelManager = new ModelManager();