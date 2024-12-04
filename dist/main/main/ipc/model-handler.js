"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupModelHandlers = setupModelHandlers;
const electron_1 = require("electron");
const model_manager_1 = require("../transcription/model-manager");
function setupModelHandlers() {
    // Create an instance inside the function
    const modelManager = new model_manager_1.ModelManager();
    // Get available models
    electron_1.ipcMain.handle('get-available-models', async () => {
        return await modelManager.getAvailableModels();
    });
    // Check if specific model is downloaded
    electron_1.ipcMain.handle('is-model-downloaded', async (_, modelName) => {
        return await modelManager.isModelDownloaded(modelName);
    });
    // Get model info
    electron_1.ipcMain.handle('get-model-info', (_, modelName) => {
        return modelManager.getModelInfo(modelName);
    });
    // Download model with progress updates
    electron_1.ipcMain.handle('download-model', async (event, modelName) => {
        try {
            await modelManager.downloadModel(modelName, (progress) => {
                // Send progress updates to renderer
                event.sender.send('model-download-progress', { modelName, progress });
            });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during download'
            };
        }
    });
}
//# sourceMappingURL=model-handler.js.map