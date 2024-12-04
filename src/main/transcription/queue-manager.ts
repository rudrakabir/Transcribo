import { Worker } from 'worker_threads';
import path from 'path';
import { getSettings, updateAudioFile } from '../database/queries';
import { TranscriptionJob } from '../../shared/types';
import { BrowserWindow } from 'electron';

class TranscriptionQueue {
  private queue: TranscriptionJob[] = [];
  private processing: Set<string> = new Set();
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.processNext = this.processNext.bind(this);
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  async add(job: TranscriptionJob) {
    // Update file status to pending
    await updateAudioFile(job.fileId, { 
      transcriptionStatus: 'pending',
      transcriptionError: ''  // Empty string instead of null
    });

    this.queue.push(job);
    this.processNext();
  }

  async cancel(fileId: string) {
    // Remove from queue if pending
    this.queue = this.queue.filter(job => job.fileId !== fileId);
    
    // Update status if was processing
    if (this.processing.has(fileId)) {
      this.processing.delete(fileId);
      await updateAudioFile(fileId, { 
        transcriptionStatus: 'unprocessed',
        transcriptionError: ''  // Empty string instead of null
      });
    }
  }

  private async processNext() {
    const settings = getSettings();
    if (
      this.queue.length === 0 || 
      this.processing.size >= settings.maxConcurrentTranscriptions
    ) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.processing.add(job.fileId);
    await updateAudioFile(job.fileId, { transcriptionStatus: 'processing' });

    const worker = new Worker(
      path.join(__dirname, 'worker.js'),
      { workerData: job }
    );

    worker.on('message', async (message) => {
      switch (message.type) {
        case 'progress':
          this.mainWindow?.webContents.send(
            'transcriptionProgress', 
            { fileId: job.fileId, progress: message.progress }
          );
          break;

        case 'completed':
          this.processing.delete(job.fileId);
          await updateAudioFile(job.fileId, {
            transcriptionStatus: 'completed',
            transcription: message.result.text,
            transcriptionError: ''  // Empty string instead of null
          });
          this.processNext();
          break;

        case 'error':
          this.processing.delete(job.fileId);
          await updateAudioFile(job.fileId, {
            transcriptionStatus: 'error',
            transcriptionError: message.error
          });
          this.processNext();
          break;
      }
    });

    worker.on('error', async (error) => {
      this.processing.delete(job.fileId);
      await updateAudioFile(job.fileId, {
        transcriptionStatus: 'error',
        transcriptionError: error.message
      });
      this.processNext();
    });
  }
}

export const transcriptionQueue = new TranscriptionQueue();