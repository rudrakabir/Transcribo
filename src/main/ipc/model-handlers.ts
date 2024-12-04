import { ipcMain } from 'electron';
import { ModelManager } from '../transcription/model-manager';

// Create a single instance
const modelManager = new ModelManager();

export function setupModelHandlers() {
  // List downloaded models
  ipcMain.handle('list-models', async () => {
    try {
      return await modelManager.listModels();
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  });

  // Download model with progress tracking
  ipcMain.handle('download-model', async (event, modelName: string) => {
    const webContents = event.sender;
    
    try {
      await modelManager.downloadModel(modelName, (progress: number) => {
        // Send progress updates to renderer
        webContents.send('model-download-progress', {
          modelName,
          progress
        });
      });
      return { success: true };
    } catch (error) {
      console.error('Error in downloadModel handler:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  // Check if model is downloaded
  ipcMain.handle('get-model-info', async (_, modelName: string) => {
    try {
      return await modelManager.getModelInfo(modelName);
    } catch (error) {
      console.error('Error getting model info:', error);
      return null;
    }
  });

  // Get available models
  ipcMain.handle('get-available-models', async () => {
    try {
      return modelManager.getAvailableModels();
    } catch (error) {
      console.error('Error getting available models:', error);
      return {};
    }
  });
}