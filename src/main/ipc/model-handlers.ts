import { ipcMain } from 'electron';
import { modelManager } from '../transcription/model-manager';

export function setupModelHandlers() {
  // Download model
  ipcMain.handle('downloadModel', async (_, modelName: string) => {
    return modelManager.downloadModel(modelName);
  });

  // Check if model is downloaded
  ipcMain.handle('isModelDownloaded', async (_, modelName: string) => {
    return modelManager.isModelDownloaded(modelName);
  });

  // Get model size
  ipcMain.handle('getModelSize', (_, modelName: string) => {
    return modelManager.getModelSize(modelName);
  });

  // List downloaded models
  ipcMain.handle('listDownloadedModels', async () => {
    return modelManager.listDownloadedModels();
  });

  // Delete model
  ipcMain.handle('deleteModel', async (_, modelName: string) => {
    return modelManager.deleteModel(modelName);
  });
}