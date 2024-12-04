import { Worker } from 'worker_threads';
import path from 'path';
import { app } from 'electron';
import { TranscriptionOptions, TranscriptionProgress, TranscriptionResult } from '../../shared/types';
import { updateAudioFile } from '../database/queries';

interface QueueItem {
  id: string;
  audioPath: string;
  options: TranscriptionOptions;
}

export class TranscriptionQueue {
  private queue: QueueItem[] = [];
  private processing: Set<string> = new Set();
  private workers: Map<string, Worker> = new Map();
  private maxConcurrent: number;

  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent;
  }

  // ... (earlier methods remain the same)

  private async processQueue(): Promise<void> {
    if (this.processing.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.processing.add(item.id);
    
    try {
      await this.startTranscription(item);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error starting transcription for ${item.id}:`, error);
      this.cleanup(item.id);
      updateAudioFile(item.id, { 
        transcriptionStatus: 'error',
        transcriptionError: errorMessage,
        transcriptionMetadata: { error: errorMessage }
      });
    }
  }

  private async startTranscription(item: QueueItem): Promise<void> {
    const worker = new Worker(path.join(app.getAppPath(), 'dist/worker.js'), {
      workerData: { id: item.id }
    });

    this.workers.set(item.id, worker);

    worker.postMessage({
      type: 'initialize',
      modelName: item.options.model
    });

    worker.on('message', async (message: {
      type: string;
      progress?: TranscriptionProgress;
      result?: TranscriptionResult;
      error?: string;
    }) => {
      switch (message.type) {
        case 'initialized':
          worker.postMessage({
            type: 'transcribe',
            audioPath: item.audioPath,
            options: item.options
          });
          break;

        case 'progress':
          if (message.progress) {
            updateAudioFile(item.id, {
              transcriptionStatus: 'processing',
              transcriptionMetadata: {
                progress: message.progress.progress,
                timeElapsed: message.progress.timeElapsed
              }
            });
          }
          break;

        case 'complete':
          if (message.result) {
            updateAudioFile(item.id, {
              transcriptionStatus: 'completed',
              transcription: JSON.stringify(message.result),
              transcriptionMetadata: {
                progress: 1,
                timeElapsed: Date.now()
              }
            });
            this.cleanup(item.id);
          }
          break;

        case 'error':
          updateAudioFile(item.id, {
            transcriptionStatus: 'error',
            transcriptionError: message.error,
            transcriptionMetadata: { error: message.error }
          });
          this.cleanup(item.id);
          break;

        case 'cancelled':
          updateAudioFile(item.id, {
            transcriptionStatus: 'unprocessed',
            transcriptionMetadata: { progress: 0 }
          });
          this.cleanup(item.id);
          break;
      }
    });

    worker.on('error', (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown worker error';
      console.error(`Worker error for ${item.id}:`, error);
      updateAudioFile(item.id, {
        transcriptionStatus: 'error',
        transcriptionError: errorMessage,
        transcriptionMetadata: { error: errorMessage }
      });
      this.cleanup(item.id);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
      this.cleanup(item.id);
    });
  }

  // ... (rest of the methods remain the same)
}