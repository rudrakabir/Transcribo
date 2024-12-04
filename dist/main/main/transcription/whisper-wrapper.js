"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhisperWrapper = void 0;
const whisperModule = require('../../build/Release/whisper.node');
class WhisperWrapper {
    constructor() {
        this.context = new whisperModule.WhisperContext();
    }
    loadModel(modelPath) {
        try {
            return this.context.loadModel(modelPath);
        }
        catch (error) {
            console.error('Error loading model:', error);
            return false;
        }
    }
    async transcribe(audioData) {
        try {
            return this.context.transcribe(audioData);
        }
        catch (error) {
            console.error('Error during transcription:', error);
            throw error;
        }
    }
}
exports.WhisperWrapper = WhisperWrapper;
//# sourceMappingURL=whisper-wrapper.js.map