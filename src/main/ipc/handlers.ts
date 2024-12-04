import { setupSettingsHandlers } from './settings-handlers';
import { setupFileHandlers } from './file-handlers';
import { setupTranscriptionHandlers } from './transcription-handlers';

export function setupIpcHandlers() {
  setupSettingsHandlers();
  setupFileHandlers();
  setupTranscriptionHandlers();
}