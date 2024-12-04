import { nodewhisper } from 'nodejs-whisper';
import { app } from 'electron';
import path from 'path';
import type { TranscriptionResult } from '../../shared/types';

interface TranscribeOptions {
  modelName: string;
  language?: string;
  progressCallback?: (progress: number) => void;
  outputFormat?: 'text' | 'srt' | 'vtt';
}

// Define the type for the whisper result
interface WhisperResult {
  text: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    words?: Array<{
      start: number;
      end: number;
      word: string;
    }>;
  }>;
  language?: string;
}

export async function transcribe(
  audioPath: string, 
  options: TranscribeOptions
): Promise<TranscriptionResult> {
  const { modelName, language = 'en', outputFormat = 'text' } = options;

  try {
    const result = await nodewhisper(audioPath, {
      modelName: modelName,
      autoDownloadModelName: modelName,
      verbose: true,
      whisperOptions: {
        outputInText: outputFormat === 'text',
        outputInVtt: outputFormat === 'vtt',
        outputInSrt: outputFormat === 'srt',
        language: language,
        wordTimestamps: true,
        splitOnWord: true,
        timestamps_length: 20,
      }
    }) as string | WhisperResult;

    // Handle string result (simple text output)
    if (typeof result === 'string') {
      return {
        text: result,
        segments: [],
        language
      };
    }

    // Handle object result (detailed output)
    return {
      text: result.text,
      segments: result.segments || [],
      language: result.language || language
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}