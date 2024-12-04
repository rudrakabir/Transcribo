"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcriptionQueue = void 0;
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const queries_1 = require("../database/queries");
class TranscriptionQueue {
    constructor() {
        this.queue = [];
        this.processing = new Set();
        this.mainWindow = null;
        this.processNext = this.processNext.bind(this);
    }
    setMainWindow(window) {
        this.mainWindow = window;
    }
    async add(job) {
        // Update file status to pending
        await (0, queries_1.updateAudioFile)(job.fileId, {
            transcriptionStatus: 'pending',
            transcriptionError: '' // Empty string instead of null
        });
        this.queue.push(job);
        this.processNext();
    }
    async cancel(fileId) {
        // Remove from queue if pending
        this.queue = this.queue.filter(job => job.fileId !== fileId);
        // Update status if was processing
        if (this.processing.has(fileId)) {
            this.processing.delete(fileId);
            await (0, queries_1.updateAudioFile)(fileId, {
                transcriptionStatus: 'unprocessed',
                transcriptionError: '' // Empty string instead of null
            });
        }
    }
    async processNext() {
        const settings = (0, queries_1.getSettings)();
        if (this.queue.length === 0 ||
            this.processing.size >= settings.maxConcurrentTranscriptions) {
            return;
        }
        const job = this.queue.shift();
        if (!job)
            return;
        this.processing.add(job.fileId);
        await (0, queries_1.updateAudioFile)(job.fileId, { transcriptionStatus: 'processing' });
        const worker = new worker_threads_1.Worker(path_1.default.join(__dirname, 'worker.js'), { workerData: job });
        worker.on('message', async (message) => {
            switch (message.type) {
                case 'progress':
                    this.mainWindow?.webContents.send('transcriptionProgress', { fileId: job.fileId, progress: message.progress });
                    break;
                case 'completed':
                    this.processing.delete(job.fileId);
                    await (0, queries_1.updateAudioFile)(job.fileId, {
                        transcriptionStatus: 'completed',
                        transcription: message.result.text,
                        transcriptionError: '' // Empty string instead of null
                    });
                    this.processNext();
                    break;
                case 'error':
                    this.processing.delete(job.fileId);
                    await (0, queries_1.updateAudioFile)(job.fileId, {
                        transcriptionStatus: 'error',
                        transcriptionError: message.error
                    });
                    this.processNext();
                    break;
            }
        });
        worker.on('error', async (error) => {
            this.processing.delete(job.fileId);
            await (0, queries_1.updateAudioFile)(job.fileId, {
                transcriptionStatus: 'error',
                transcriptionError: error.message
            });
            this.processNext();
        });
    }
}
exports.transcriptionQueue = new TranscriptionQueue();
//# sourceMappingURL=queue-manager.js.map