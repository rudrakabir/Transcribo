"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhisperService = void 0;
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const whisper_wrapper_1 = require("./whisper-wrapper");
const fs_1 = require("fs");
const audio_loader_1 = require("../utils/audio-loader"); // We'll create this utility
class WhisperService {
    constructor() {
        this.whisper = null;
        this.currentModelPath = null;
        this.modelsDir = path_1.default.join(electron_1.app.getPath('userData'), 'models');
    }
    async initialize(modelName) {
        const modelPath = path_1.default.join(this.modelsDir, `${modelName}.bin`);
        // Check if model exists
        try {
            await fs_1.promises.access(modelPath);
        }
        catch (error) {
            throw new Error(`Model ${modelName} not found at ${modelPath}`);
        }
        // If we're switching models, create a new instance
        if (this.currentModelPath !== modelPath) {
            this.whisper = new whisper_wrapper_1.WhisperWrapper();
            const success = this.whisper.loadModel(modelPath);
            if (!success) {
                throw new Error(`Failed to load model ${modelName}`);
            }
            this.currentModelPath = modelPath;
        }
    }
    async transcribe(audioPath, options, progressCallback) {
        if (!this.whisper) {
            throw new Error('WhisperService not initialized. Call initialize() first.');
        }
        try {
            // Load and convert audio file to Float32Array
            const audioData = await (0, audio_loader_1.loadAudioFile)(audioPath);
            const startTime = Date.now();
            const result = await this.whisper.transcribe(audioData, {
                ...options,
                onProgress: (progress) => {
                    if (progressCallback) {
                        progressCallback({
                            progress,
                            timeElapsed: Date.now() - startTime
                        });
                    }
                }
            });
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown transcription error';
            throw new Error(`Transcription failed: ${errorMessage}`);
        }
    }
    async cleanup() {
        if (this.whisper) {
            this.whisper.release();
            this.whisper = null;
            this.currentModelPath = null;
        }
    }
}
exports.WhisperService = WhisperService;
//# sourceMappingURL=whisper.js.map