import { setupSettingsHandlers } from './settings-handlers';
import { setupFileHandlers } from './file-handlers';
import { setupTranscriptionHandlers } from './transcription-handlers';
import { setupModelHandlers } from './model-handlers';
import { modelManager } from '../transcription/model-manager';

export async function setupIpcHandlers() {
  // Initialize model manager
  await modelManager.initialize();
  
  // Setup all handlers
  setupSettingsHandlers();
  setupFileHandlers();
  setupTranscriptionHandlers();
  setupModelHandlers();
}