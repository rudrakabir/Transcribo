"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptionQueue = void 0;
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const queries_1 = require("../database/queries");
class TranscriptionQueue {
    constructor(maxConcurrent = 2) {
        this.queue = [];
        this.processing = new Set();
        this.workers = new Map();
        this.maxConcurrent = maxConcurrent;
    }
    setMaxConcurrent(limit) {
        if (limit < 1)
            throw new Error('Concurrent limit must be at least 1');
        this.maxConcurrent = limit;
        this.processQueue();
    }
    addToQueue(item) {
        this.queue.push(item);
        (0, queries_1.updateAudioFile)(item.id, {
            transcriptionStatus: 'pending',
            transcriptionMetadata: { progress: 0 }
        });
        this.processQueue();
    }
    cancelTranscription(id) {
        const worker = this.workers.get(id);
        if (worker) {
            worker.postMessage({ type: 'cancel' });
            this.cleanup(id);
        }
        // Remove from queue if not yet processing
        this.queue = this.queue.filter(item => item.id !== id);
    }
    getQueueLength() {
        return this.queue.length;
    }
    getProcessingCount() {
        return this.processing.size;
    }
    getConcurrentLimit() {
        return this.maxConcurrent;
    }
    cleanup(id) {
        const worker = this.workers.get(id);
        if (worker) {
            worker.terminate();
            this.workers.delete(id);
        }
        this.processing.delete(id);
        this.processQueue();
    }
    async processQueue() {
        if (this.processing.size >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }
        const item = this.queue.shift();
        if (!item)
            return;
        this.processing.add(item.id);
        try {
            await this.startTranscription(item);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error(`Error starting transcription for ${item.id}:`, error);
            this.cleanup(item.id);
            (0, queries_1.updateAudioFile)(item.id, {
                transcriptionStatus: 'error',
                transcriptionError: errorMessage,
                transcriptionMetadata: { error: errorMessage }
            });
        }
    }
    async startTranscription(item) {
        const worker = new worker_threads_1.Worker(path_1.default.join(electron_1.app.getAppPath(), 'dist/worker.js'), {
            workerData: { id: item.id }
        });
        this.workers.set(item.id, worker);
        worker.postMessage({
            type: 'initialize',
            modelName: item.options.model
        });
        worker.on('message', async (message) => {
            switch (message.type) {
                case 'initialized':
                    worker.postMessage({
                        type: 'transcribe',
                        audioPath: item.audioPath,
                        options: item.options
                    });
                    break;
                case 'progress':
                    if (message.progress) {
                        (0, queries_1.updateAudioFile)(item.id, {
                            transcriptionStatus: 'processing',
                            transcriptionMetadata: {
                                progress: message.progress.progress,
                                timeElapsed: message.progress.timeElapsed
                            }
                        });
                    }
                    break;
                case 'complete':
                    if (message.result) {
                        (0, queries_1.updateAudioFile)(item.id, {
                            transcriptionStatus: 'completed',
                            transcription: JSON.stringify(message.result),
                            transcriptionMetadata: {
                                progress: 1,
                                timeElapsed: Date.now()
                            }
                        });
                        this.cleanup(item.id);
                    }
                    break;
                case 'error':
                    (0, queries_1.updateAudioFile)(item.id, {
                        transcriptionStatus: 'error',
                        transcriptionError: message.error,
                        transcriptionMetadata: { error: message.error }
                    });
                    this.cleanup(item.id);
                    break;
                case 'cancelled':
                    (0, queries_1.updateAudioFile)(item.id, {
                        transcriptionStatus: 'unprocessed',
                        transcriptionMetadata: { progress: 0 }
                    });
                    this.cleanup(item.id);
                    break;
            }
        });
        worker.on('error', (error) => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown worker error';
            console.error(`Worker error for ${item.id}:`, error);
            (0, queries_1.updateAudioFile)(item.id, {
                transcriptionStatus: 'error',
                transcriptionError: errorMessage,
                transcriptionMetadata: { error: errorMessage }
            });
            this.cleanup(item.id);
        });
        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker stopped with exit code ${code}`);
            }
            this.cleanup(item.id);
        });
    }
}
exports.TranscriptionQueue = TranscriptionQueue;
//# sourceMappingURL=queue-manager.js.map