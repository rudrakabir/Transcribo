import path from 'path';
import { app } from 'electron';
import { WhisperWrapper } from './whisper-wrapper';
import { promises as fs } from 'fs';
import { TranscriptionOptions, TranscriptionProgress, TranscriptionResult } from '../../shared/types';

export class WhisperService {
  private modelsDir: string;
  private whisper: WhisperWrapper | null = null;
  private currentModelPath: string | null = null;

  constructor() {
    this.modelsDir = path.join(app.getPath('userData'), 'models');
  }

  public async initialize(modelName: string): Promise<void> {
    const modelPath = path.join(this.modelsDir, `${modelName}.bin`);
    
    // Check if model exists
    try {
      await fs.access(modelPath);
    } catch (error) {
      throw new Error(`Model ${modelName} not found at ${modelPath}`);
    }

    // If we're switching models, create a new instance
    if (this.currentModelPath !== modelPath) {
      this.whisper = new WhisperWrapper();
      const success = this.whisper.loadModel(modelPath);
      if (!success) {
        throw new Error(`Failed to load model ${modelName}`);
      }
      this.currentModelPath = modelPath;
    }
  }

  public async transcribe(
    audioPath: string,
    options: TranscriptionOptions,
    progressCallback?: (progress: TranscriptionProgress) => void
  ): Promise<TranscriptionResult> {
    if (!this.whisper) {
      throw new Error('WhisperService not initialized. Call initialize() first.');
    }

    try {
      const startTime = Date.now();
      const result = await this.whisper.transcribe(audioPath, {
        ...options,
        onProgress: (progress: number) => {
          if (progressCallback) {
            progressCallback({
              progress,
              status: 'processing',
              timeElapsed: Date.now() - startTime
            });
          }
        }
      });

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown transcription error';
      throw new Error(`Transcription failed: ${errorMessage}`);
    }
  }

  public async cleanup(): Promise<void> {
    if (this.whisper) {
      this.whisper.release();
      this.whisper = null;
      this.currentModelPath = null;
    }
  }
}