import { ipcMain } from 'electron';
import { TranscriptionQueue } from '../transcription/queue-manager';
import { TranscriptionOptions } from '../../shared/types';
import { getSettings } from '../database/queries';
import { v4 as uuidv4 } from 'uuid';

// Create a single instance of the transcription queue
const transcriptionQueue = new TranscriptionQueue();

// Initialize with settings
const settings = getSettings();
transcriptionQueue.setMaxConcurrent(settings.maxConcurrentTranscriptions);

export function setupTranscriptionHandlers(): void {
  // Start transcription for a file
  ipcMain.handle('start-transcription', async (_, audioPath: string, options?: Partial<TranscriptionOptions>) => {
    const settings = getSettings();
    const transcriptionId = uuidv4();

    // Merge default settings with provided options
    const fullOptions: TranscriptionOptions = {
      model: settings.whisperModel,
      language: settings.language,
      useGPU: settings.useGPU,
      ...options
    };

    transcriptionQueue.addToQueue({
      id: transcriptionId,
      audioPath,
      options: fullOptions
    });

    return transcriptionId;
  });

  // Cancel transcription
  ipcMain.handle('cancel-transcription', async (_, id: string) => {
    transcriptionQueue.cancelTranscription(id);
    return true;
  });

  // Get queue status
  ipcMain.handle('get-queue-status', () => {
    return {
      queueLength: transcriptionQueue.getQueueLength(),
      processingCount: transcriptionQueue.getProcessingCount(),
      maxConcurrent: transcriptionQueue.getConcurrentLimit()
    };
  });

  // Update concurrent limit
  ipcMain.handle('update-concurrent-limit', (_, limit: number) => {
    transcriptionQueue.setMaxConcurrent(limit);
    return true;
  });
}