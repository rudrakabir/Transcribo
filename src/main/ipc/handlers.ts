import { ipcMain } from 'electron';
import { ModelManager } from '../transcription/model-manager';

// Create instances
const modelManager = new ModelManager();

export function setupIpcHandlers() {
  // Your other handlers here...
}