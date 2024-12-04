"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const whisper_1 = require("./whisper");
const worker_threads_1 = require("worker_threads");
let whisperService = null;
let isProcessing = false;
// Handle messages from the main thread
worker_threads_1.parentPort?.on('message', async (message) => {
    try {
        switch (message.type) {
            case 'initialize':
                if (!message.modelName) {
                    throw new Error('Model name required for initialization');
                }
                await handleInitialize(message.modelName);
                break;
            case 'transcribe':
                if (!message.audioPath || !message.options) {
                    throw new Error('Audio path and options required for transcription');
                }
                await handleTranscribe(message.audioPath, message.options);
                break;
            case 'cancel':
                handleCancel();
                break;
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        worker_threads_1.parentPort?.postMessage({
            type: 'error',
            error: errorMessage
        });
    }
});
async function handleInitialize(modelName) {
    try {
        whisperService = new whisper_1.WhisperService();
        await whisperService.initialize(modelName);
        worker_threads_1.parentPort?.postMessage({ type: 'initialized' });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        throw new Error(`Failed to initialize WhisperService: ${errorMessage}`);
    }
}
async function handleTranscribe(audioPath, options) {
    if (!whisperService) {
        throw new Error('WhisperService not initialized');
    }
    if (isProcessing) {
        throw new Error('Already processing a file');
    }
    isProcessing = true;
    try {
        const result = await whisperService.transcribe(audioPath, options, (progress) => {
            worker_threads_1.parentPort?.postMessage({
                type: 'progress',
                progress
            });
        });
        worker_threads_1.parentPort?.postMessage({
            type: 'complete',
            result
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown transcription error';
        throw new Error(`Transcription failed: ${errorMessage}`);
    }
    finally {
        isProcessing = false;
    }
}
function handleCancel() {
    if (isProcessing) {
        // Signal cancellation
        isProcessing = false;
        worker_threads_1.parentPort?.postMessage({ type: 'cancelled' });
    }
}
// Cleanup on exit
process.on('exit', () => {
    if (whisperService) {
        whisperService.cleanup().catch((error) => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown cleanup error';
            console.error('Error during cleanup:', errorMessage);
        });
    }
});
//# sourceMappingURL=worker.js.map