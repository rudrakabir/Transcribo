import { ipcMain } from 'electron';
import { setupSettingsHandlers } from './settings-handlers';
import { setupFileHandlers } from './file-handlers';
import { setupTranscriptionHandlers } from './transcription-handlers';
import { setupModelHandlers } from './model-handlers';

export async function setupIpcHandlers() {
  // Set up all handlers
  setupSettingsHandlers();
  setupFileHandlers();
  setupTranscriptionHandlers();
  setupModelHandlers();
  
  // Log registered handlers for debugging
  console.log('IPC Handlers initialized successfully');
}