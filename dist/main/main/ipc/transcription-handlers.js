"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTranscriptionHandlers = setupTranscriptionHandlers;
const electron_1 = require("electron");
const queue_manager_1 = require("../transcription/queue-manager");
const queries_1 = require("../database/queries");
const uuid_1 = require("uuid");
// Create a single instance of the transcription queue
const transcriptionQueue = new queue_manager_1.TranscriptionQueue();
// Initialize with settings
const settings = (0, queries_1.getSettings)();
transcriptionQueue.setMaxConcurrent(settings.maxConcurrentTranscriptions);
function setupTranscriptionHandlers() {
    // Start transcription for a file
    electron_1.ipcMain.handle('start-transcription', async (_, audioPath, options) => {
        const settings = (0, queries_1.getSettings)();
        const transcriptionId = (0, uuid_1.v4)();
        // Merge default settings with provided options
        const fullOptions = {
            model: settings.whisperModel,
            language: settings.language,
            useGPU: settings.useGPU,
            ...options
        };
        transcriptionQueue.addToQueue({
            id: transcriptionId,
            audioPath,
            options: fullOptions
        });
        return transcriptionId;
    });
    // Cancel transcription
    electron_1.ipcMain.handle('cancel-transcription', async (_, id) => {
        transcriptionQueue.cancelTranscription(id);
        return true;
    });
    // Get queue status
    electron_1.ipcMain.handle('get-queue-status', () => {
        return {
            queueLength: transcriptionQueue.getQueueLength(),
            processingCount: transcriptionQueue.getProcessingCount(),
            maxConcurrent: transcriptionQueue.getConcurrentLimit()
        };
    });
    // Update concurrent limit
    electron_1.ipcMain.handle('update-concurrent-limit', (_, limit) => {
        transcriptionQueue.setMaxConcurrent(limit);
        return true;
    });
}
//# sourceMappingURL=transcription-handlers.js.map