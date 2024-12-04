"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhisperWrapper = void 0;
// Import the native module
const whisperModule = require('../../../build/Release/whisper.node');
class WhisperWrapper {
    constructor() {
        this.context = null;
        try {
            this.context = new whisperModule.WhisperContext();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to initialize Whisper context: ${errorMessage}`);
        }
    }
    loadModel(modelPath) {
        if (!this.context) {
            throw new Error('Whisper context not initialized');
        }
        try {
            return this.context.loadModel(modelPath);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to load model: ${errorMessage}`);
        }
    }
    async transcribe(audioData, options) {
        if (!this.context) {
            throw new Error('Whisper context not initialized');
        }
        try {
            const result = await this.context.transcribe(audioData, {
                language: options.language,
                translate: options.task === 'translate',
                useGPU: options.useGPU,
                threads: 4,
                onProgress: options.onProgress
            });
            return {
                text: result.text,
                segments: this.convertSegments(result.segments),
                language: result.language,
                duration: result.duration
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Transcription failed: ${errorMessage}`);
        }
    }
    convertSegments(segments) {
        return segments.map((segment) => ({
            id: segment.id,
            start: segment.start,
            end: segment.end,
            text: segment.text,
            confidence: segment.confidence
        }));
    }
    release() {
        if (this.context) {
            try {
                this.context.release();
                this.context = null;
            }
            catch (error) {
                console.error('Error releasing Whisper context:', error);
            }
        }
    }
}
exports.WhisperWrapper = WhisperWrapper;
//# sourceMappingURL=whisper-wrapper.js.map