"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTranscriptionHandlers = setupTranscriptionHandlers;
const electron_1 = require("electron");
const queries_1 = require("../database/queries");
const queue_manager_1 = require("../transcription/queue-manager");
function setupTranscriptionHandlers() {
    // Start transcription
    electron_1.ipcMain.handle('startTranscription', async (_, fileId) => {
        const settings = (0, queries_1.getSettings)();
        const job = {
            fileId,
            audioPath: '', // Get from database
            modelName: settings.whisperModel,
            language: settings.language
        };
        await queue_manager_1.transcriptionQueue.add(job);
        return true;
    });
    // Cancel transcription
    electron_1.ipcMain.handle('cancelTranscription', async (_, fileId) => {
        await queue_manager_1.transcriptionQueue.cancel(fileId);
        return true;
    });
}
//# sourceMappingURL=transcription-handlers.js.map