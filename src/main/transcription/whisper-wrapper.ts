import { TranscriptionOptions, TranscriptionResult, TranscriptionSegment } from '../../shared/types';

// Import the native module
const whisperModule = require('../../../build/Release/whisper.node');

interface WhisperContext {
  loadModel(modelPath: string): boolean;
  transcribe(audioData: Float32Array, options: WhisperOptions): Promise<WhisperResult>;
  release(): void;
}

interface WhisperOptions {
  language?: string;
  translate?: boolean;
  useGPU?: boolean;
  threads?: number;
  onProgress?: (progress: number) => void;
}

interface WhisperResult {
  text: string;
  segments: WhisperSegment[];
  language: string;
  duration: number;
}

interface WhisperSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export class WhisperWrapper {
  private context: WhisperContext | null = null;

  constructor() {
    try {
      this.context = new whisperModule.WhisperContext();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize Whisper context: ${errorMessage}`);
    }
  }

  public loadModel(modelPath: string): boolean {
    if (!this.context) {
      throw new Error('Whisper context not initialized');
    }

    try {
      return this.context.loadModel(modelPath);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load model: ${errorMessage}`);
    }
  }

  public async transcribe(
    audioData: Float32Array,
    options: TranscriptionOptions & { onProgress?: (progress: number) => void }
  ): Promise<TranscriptionResult> {
    if (!this.context) {
      throw new Error('Whisper context not initialized');
    }

    try {
      const result = await this.context.transcribe(audioData, {
        language: options.language,
        translate: options.task === 'translate',
        useGPU: options.useGPU,
        threads: 4,
        onProgress: options.onProgress
      });

      return {
        text: result.text,
        segments: result.segments.map(this.convertSegment),
        language: result.language,
        duration: result.duration
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Transcription failed: ${errorMessage}`);
    }
  }

  private convertSegment(segment: WhisperSegment): TranscriptionSegment {
    return {
      start: segment.start,
      end: segment.end,
      text: segment.text,
      confidence: segment.confidence
    };
  }

  public release(): void {
    if (this.context) {
      try {
        this.context.release();
        this.context = null;
      } catch (error) {
        console.error('Error releasing Whisper context:', error);
      }
    }
  }
}