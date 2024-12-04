import { ipcMain } from 'electron';
import { getSettings } from '../database/queries';
import { transcriptionQueue } from '../transcription/queue-manager';
import { TranscriptionJob } from '../../shared/types';

export function setupTranscriptionHandlers() {
  // Start transcription
  ipcMain.handle('startTranscription', async (_, fileId: string) => {
    const settings = getSettings();
    
    const job: TranscriptionJob = {
      fileId,
      audioPath: '', // Get from database
      modelName: settings.whisperModel,
      language: settings.language
    };

    await transcriptionQueue.add(job);
    return true;
  });

  // Cancel transcription
  ipcMain.handle('cancelTranscription', async (_, fileId: string) => {
    await transcriptionQueue.cancel(fileId);
    return true;
  });
}