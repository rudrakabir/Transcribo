"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAudioFile = loadAudioFile;
const ffmpeg_1 = require("@ffmpeg/ffmpeg");
const util_1 = require("@ffmpeg/util");
const fs_1 = require("fs");
let ffmpeg = null;
async function loadAudioFile(filePath) {
    // Initialize FFmpeg if not already done
    if (!ffmpeg) {
        ffmpeg = new ffmpeg_1.FFmpeg();
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';
        await ffmpeg.load({
            coreURL: await (0, util_1.toBlobURL)(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await (0, util_1.toBlobURL)(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    }
    try {
        // Read the audio file
        const audioBuffer = await fs_1.promises.readFile(filePath);
        // Convert Buffer to Uint8Array for FFmpeg
        const audioData = new Uint8Array(audioBuffer);
        // Write input file to FFmpeg's virtual filesystem
        await ffmpeg.writeFile('input', audioData);
        // Convert to WAV format with required specifications
        await ffmpeg.exec([
            '-i', 'input',
            '-ar', '16000', // Sample rate required by Whisper
            '-ac', '1', // Mono channel
            '-f', 'wav', // WAV format
            'output.wav'
        ]);
        // Read the converted file
        const wavData = await ffmpeg.readFile('output.wav');
        // Clean up
        await ffmpeg.deleteFile('input');
        await ffmpeg.deleteFile('output.wav');
        // Skip WAV header (44 bytes) and convert to float
        const samples = new Int16Array(wavData.buffer.slice(wavData.byteOffset + 44, wavData.byteOffset + wavData.byteLength));
        const float32Samples = new Float32Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            // Convert 16-bit integer to float in range [-1, 1]
            float32Samples[i] = samples[i] / 32768.0;
        }
        return float32Samples;
    }
    catch (error) {
        console.error('Error processing audio file:', error);
        throw new Error(`Failed to process audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
//# sourceMappingURL=audio-loader.js.map