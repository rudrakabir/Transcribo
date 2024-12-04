import { ipcMain } from 'electron';

export function setupTranscriptionHandlers() {
  // Placeholder for transcription handlers
  // Will implement with Whisper integration
  ipcMain.handle('startTranscription', async () => {
    // TODO: Implement with Whisper
  });

  ipcMain.handle('cancelTranscription', async () => {
    // TODO: Implement with Whisper
  });

  ipcMain.handle('updateTranscription', async () => {
    // TODO: Implement with Whisper
  });
}