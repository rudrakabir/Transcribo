import { ipcMain } from 'electron';
import { ModelManager } from '../transcription/model-manager';

export function setupModelHandlers() {
  // Create an instance inside the function
  const modelManager = new ModelManager();

  // Get available models
  ipcMain.handle('get-available-models', async () => {
    return await modelManager.getAvailableModels();
  });

  // Check if specific model is downloaded
  ipcMain.handle('is-model-downloaded', async (_, modelName: string) => {
    return await modelManager.isModelDownloaded(modelName);
  });

  // Get model info
  ipcMain.handle('get-model-info', (_, modelName: string) => {
    return modelManager.getModelInfo(modelName);
  });

  // Download model with progress updates
  ipcMain.handle('download-model', async (event, modelName: string) => {
    try {
      await modelManager.downloadModel(modelName, (progress: number) => {
        // Send progress updates to renderer
        event.sender.send('model-download-progress', { modelName, progress });
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during download'
      };
    }
  });
}