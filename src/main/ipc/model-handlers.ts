import { ipcMain } from 'electron';
import { ModelManager } from '../transcription/model-manager';

// Create a single instance
const modelManager = new ModelManager();

export function setupModelHandlers() {
  // Download model with progress tracking
  ipcMain.handle('downloadModel', async (event, modelName: string) => {
    const webContents = event.sender;
    
    try {
      await modelManager.downloadModel(modelName, (progress: number) => {
        // Send progress updates to renderer
        webContents.send('modelDownloadProgress', {
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
  ipcMain.handle('isModelDownloaded', async (_, modelName: string) => {
    try {
      return await modelManager.isModelDownloaded(modelName);
    } catch (error) {
      console.error('Error checking if model is downloaded:', error);
      throw error;
    }
  });

  // Get available models
  ipcMain.handle('getAvailableModels', async () => {
    try {
      return await modelManager.getAvailableModels();
    } catch (error) {
      console.error('Error getting available models:', error);
      return [];
    }
  });

  // Get model info
  ipcMain.handle('getModelInfo', (_, modelName: string) => {
    return modelManager.getModelInfo(modelName);
  });
}