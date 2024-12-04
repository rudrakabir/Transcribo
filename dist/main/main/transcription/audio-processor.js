"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioProcessor = void 0;
const fs_1 = require("fs");
const fs_2 = require("fs");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const crypto_1 = require("crypto");
class AudioProcessor {
    constructor() {
        this.tmpDir = path_1.default.join(electron_1.app.getPath('temp'), 'transcribo');
        // Ensure temp directory exists
        fs_1.promises.mkdir(this.tmpDir, { recursive: true }).catch(console.error);
    }
    async preprocessAudio(filePath) {
        // Get file hash for temp file naming
        const fileHash = await this.getFileHash(filePath);
        const tempWavPath = path_1.default.join(this.tmpDir, `${fileHash}.wav`);
        try {
            // Convert to WAV if needed
            await this.convertToWav(filePath, tempWavPath);
            // Get audio metadata
            const metadata = await this.getAudioMetadata(tempWavPath);
            // Read and convert to float32 array
            const audioData = await this.readAudioData(tempWavPath);
            // Cleanup temp file
            await fs_1.promises.unlink(tempWavPath).catch(console.error);
            return { audioData, metadata };
        }
        catch (error) {
            // Cleanup on error
            await fs_1.promises.unlink(tempWavPath).catch(console.error);
            throw error;
        }
    }
    async getFileHash(filePath) {
        const fileBuffer = await fs_1.promises.readFile(filePath);
        return (0, crypto_1.createHash)('md5').update(fileBuffer).digest('hex');
    }
    async convertToWav(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            const ffmpeg = (0, child_process_1.spawn)('ffmpeg', [
                '-i', inputPath,
                '-ar', '16000', // Sample rate required by Whisper
                '-ac', '1', // Mono audio
                '-c:a', 'pcm_s16le', // 16-bit PCM
                outputPath
            ]);
            let errorOutput = '';
            ffmpeg.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`FFmpeg conversion failed: ${errorOutput}`));
                }
            });
            ffmpeg.on('error', reject);
        });
    }
    async getAudioMetadata(filePath) {
        return new Promise((resolve, reject) => {
            const ffprobe = (0, child_process_1.spawn)('ffprobe', [
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                filePath
            ]);
            let output = '';
            ffprobe.stdout.on('data', (data) => {
                output += data.toString();
            });
            ffprobe.on('close', (code) => {
                if (code === 0) {
                    try {
                        const data = JSON.parse(output);
                        const audioStream = data.streams.find((stream) => stream.codec_type === 'audio');
                        if (!audioStream) {
                            throw new Error('No audio stream found');
                        }
                        const stats = (0, fs_2.statSync)(filePath);
                        resolve({
                            format: data.format.format_name,
                            size: stats.size,
                            duration: parseFloat(data.format.duration),
                            sampleRate: parseInt(audioStream.sample_rate),
                            channels: audioStream.channels,
                            bitrate: audioStream.bit_rate ? parseInt(audioStream.bit_rate) : undefined,
                            codec: audioStream.codec_name
                        });
                    }
                    catch (error) {
                        reject(new Error('Failed to parse audio metadata'));
                    }
                }
                else {
                    reject(new Error('FFprobe analysis failed'));
                }
            });
            ffprobe.on('error', reject);
        });
    }
    async readAudioData(wavPath) {
        const buffer = await fs_1.promises.readFile(wavPath);
        // Skip WAV header (44 bytes) and convert to float32
        const samples = new Int16Array(buffer.buffer, 44, (buffer.length - 44) / 2);
        // Convert to float32 (-1.0 to 1.0 range)
        const float32Data = new Float32Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            float32Data[i] = samples[i] / 32768.0;
        }
        return float32Data;
    }
}
exports.AudioProcessor = AudioProcessor;
//# sourceMappingURL=audio-processor.js.map