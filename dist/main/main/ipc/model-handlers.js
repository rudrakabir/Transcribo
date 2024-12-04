"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupModelHandlers = setupModelHandlers;
const electron_1 = require("electron");
const model_manager_1 = require("../transcription/model-manager");
// Create a single instance
const modelManager = new model_manager_1.ModelManager();
function setupModelHandlers() {
    // Download model with progress tracking
    electron_1.ipcMain.handle('download-model', async (event, modelName) => {
        const webContents = event.sender;
        try {
            await modelManager.downloadModel(modelName, (progress) => {
                // Send progress updates to renderer
                webContents.send('model-download-progress', {
                    modelName,
                    progress
                });
            });
            return { success: true };
        }
        catch (error) {
            console.error('Error in downloadModel handler:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    });
    // Check if model is downloaded
    electron_1.ipcMain.handle('get-model-info', async (_, modelName) => {
        try {
            return await modelManager.getModelInfo(modelName);
        }
        catch (error) {
            console.error('Error getting model info:', error);
            return null;
        }
    });
    // Get available models
    electron_1.ipcMain.handle('get-available-models', async () => {
        try {
            return await modelManager.getAvailableModels();
        }
        catch (error) {
            console.error('Error getting available models:', error);
            return [];
        }
    });
}
//# sourceMappingURL=model-handlers.js.map