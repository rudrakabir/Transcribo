import { join } from 'path';

const whisperModule = require('../../build/Release/whisper.node');

export class WhisperWrapper {
  private context: any;

  constructor() {
    this.context = new whisperModule.WhisperContext();
  }

  public loadModel(modelPath: string): boolean {
    try {
      return this.context.loadModel(modelPath);
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }

  public async transcribe(audioData: Float32Array): Promise<string> {
    try {
      return this.context.transcribe(audioData);
    } catch (error) {
      console.error('Error during transcription:', error);
      throw error;
    }
  }
}
