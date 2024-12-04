import { WhisperService } from './whisper';
import { parentPort, workerData } from 'worker_threads';
import { TranscriptionOptions, TranscriptionProgress, TranscriptionResult } from '../../shared/types';

let whisperService: WhisperService | null = null;
let isProcessing = false;

// Handle messages from the main thread
parentPort?.on('message', async (message: {
  type: 'initialize' | 'transcribe' | 'cancel';
  modelName?: string;
  audioPath?: string;
  options?: TranscriptionOptions;
}) => {
  try {
    switch (message.type) {
      case 'initialize':
        if (!message.modelName) {
          throw new Error('Model name required for initialization');
        }
        await handleInitialize(message.modelName);
        break;

      case 'transcribe':
        if (!message.audioPath || !message.options) {
          throw new Error('Audio path and options required for transcription');
        }
        await handleTranscribe(message.audioPath, message.options);
        break;

      case 'cancel':
        handleCancel();
        break;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    parentPort?.postMessage({
      type: 'error',
      error: errorMessage
    });
  }
});

async function handleInitialize(modelName: string): Promise<void> {
  try {
    whisperService = new WhisperService();
    await whisperService.initialize(modelName);
    parentPort?.postMessage({ type: 'initialized' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
    throw new Error(`Failed to initialize WhisperService: ${errorMessage}`);
  }
}

async function handleTranscribe(audioPath: string, options: TranscriptionOptions): Promise<void> {
  if (!whisperService) {
    throw new Error('WhisperService not initialized');
  }

  if (isProcessing) {
    throw new Error('Already processing a file');
  }

  isProcessing = true;

  try {
    const result = await whisperService.transcribe(
      audioPath,
      options,
      (progress: TranscriptionProgress) => {
        parentPort?.postMessage({
          type: 'progress',
          progress
        });
      }
    );

    parentPort?.postMessage({
      type: 'complete',
      result
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown transcription error';
    throw new Error(`Transcription failed: ${errorMessage}`);
  } finally {
    isProcessing = false;
  }
}

function handleCancel(): void {
  if (isProcessing) {
    // Signal cancellation
    isProcessing = false;
    parentPort?.postMessage({ type: 'cancelled' });
  }
}

// Cleanup on exit
process.on('exit', () => {
  if (whisperService) {
    whisperService.cleanup().catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown cleanup error';
      console.error('Error during cleanup:', errorMessage);
    });
  }
});