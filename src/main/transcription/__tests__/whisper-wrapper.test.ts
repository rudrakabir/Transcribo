import { promises as fs } from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { WhisperWrapper } from '../whisper-wrapper';
import { checkSystemRequirements } from './utils/system-checks';
import { TranscriptionOptions } from '../../../shared/types';
import { ModelManager } from '../model-manager';

describe('WhisperWrapper Integration Tests', () => {
    let whisperWrapper: WhisperWrapper;
    let modelManager: ModelManager;
    const modelsDir = path.join(app.getPath('userData'), 'models');
    const modelName = 'tiny'; // Using tiny model for faster tests
    let modelPath: string;
    const jfkMp3Path = path.join(__dirname, '../../../../native/whisper/samples/jfk.mp3');
    const jfkWavPath = path.join(__dirname, '../../../../native/whisper/samples/jfk.wav');
    
    // Helper function to read audio file as Float32Array
    async function readAudioFile(filePath: string): Promise<Float32Array> {
        const buffer = await fs.readFile(filePath);
        // In a real implementation, you'd use proper audio decoding here
        // For testing, we'll just create a dummy Float32Array
        return new Float32Array(buffer.buffer);
    }

    beforeAll(async () => {
        // Check system requirements
        await checkSystemRequirements();
        
        // Initialize model manager and download model if needed
        modelManager = new ModelManager();
        
        // Check if model is downloaded, if not download it
        const isDownloaded = await modelManager.isModelDownloaded(modelName);
        if (!isDownloaded) {
            await modelManager.downloadModel(modelName, (progress) => {
                console.log(`Downloading model: ${progress * 100}%`);
            });
        }
        
        modelPath = path.join(modelsDir, `ggml-${modelName}.bin`);
        
        // Initialize wrapper
        whisperWrapper = new WhisperWrapper();
        
        // Verify model file exists
        const modelExists = await fs.access(modelPath)
            .then(() => true)
            .catch(() => false);
            
        if (!modelExists) {
            throw new Error(`Model file not found at ${modelPath}`);
        }
    });

    describe('Model Loading', () => {
        it('should load the model successfully', () => {
            const success = whisperWrapper.loadModel(modelPath);
            expect(success).toBe(true);
        });

        it('should throw error when loading invalid model', () => {
            expect(() => {
                whisperWrapper.loadModel('invalid/path/model.bin');
            }).toThrow();
        });
    });

    describe('Transcription', () => {
        beforeEach(() => {
            // Ensure fresh model load before each test
            whisperWrapper.loadModel(modelPath);
        });

        it('should transcribe MP3 file', async () => {
            const audioData = await readAudioFile(jfkMp3Path);
            const options: TranscriptionOptions = {
                model: modelName,
                language: 'en',
                task: 'transcribe',
                useGPU: false
            };

            const result = await whisperWrapper.transcribe(audioData, {
                ...options,
                onProgress: (progress) => {
                    expect(progress).toBeGreaterThanOrEqual(0);
                    expect(progress).toBeLessThanOrEqual(1);
                }
            });

            expect(result).toBeDefined();
            expect(result.text).toBeDefined();
            expect(result.text.length).toBeGreaterThan(0);
            expect(result.segments.length).toBeGreaterThan(0);
            expect(result.language).toBe('en');
            expect(result.duration).toBeGreaterThan(0);
        });

        it('should transcribe WAV file', async () => {
            const audioData = await readAudioFile(jfkWavPath);
            const result = await whisperWrapper.transcribe(audioData, {
                model: modelName,
                language: 'en',
                task: 'transcribe',
                useGPU: false
            });

            expect(result).toBeDefined();
            expect(result.text.length).toBeGreaterThan(0);
        });

        it('should handle translation task', async () => {
            const audioData = await readAudioFile(jfkMp3Path);
            const result = await whisperWrapper.transcribe(audioData, {
                model: modelName,
                language: 'en',
                task: 'translate',
                useGPU: false
            });

            expect(result).toBeDefined();
            expect(result.text.length).toBeGreaterThan(0);
        });

        it('should detect language when not specified', async () => {
            const audioData = await readAudioFile(jfkMp3Path);
            const result = await whisperWrapper.transcribe(audioData, {
                model: modelName,
                task: 'transcribe',
                useGPU: false
            });

            expect(result.language).toBeDefined();
            expect(result.language.length).toBeGreaterThan(0);
        });

        it('should handle progress callbacks', async () => {
            const audioData = await readAudioFile(jfkMp3Path);
            const progressMock = jest.fn();

            await whisperWrapper.transcribe(audioData, {
                model: modelName,
                language: 'en',
                task: 'transcribe',
                useGPU: false,
                onProgress: progressMock
            });

            expect(progressMock).toHaveBeenCalled();
            const calls = progressMock.mock.calls;
            expect(calls.length).toBeGreaterThan(0);
            // Verify progress values are between 0 and 1
            calls.forEach(([progress]) => {
                expect(progress).toBeGreaterThanOrEqual(0);
                expect(progress).toBeLessThanOrEqual(1);
            });
            // Verify last call is with progress 1
            expect(calls[calls.length - 1][0]).toBe(1);
        });

        it('should handle GPU acceleration when available', async () => {
            const audioData = await readAudioFile(jfkMp3Path);
            const result = await whisperWrapper.transcribe(audioData, {
                model: modelName,
                language: 'en',
                task: 'transcribe',
                useGPU: true
            });

            expect(result).toBeDefined();
            expect(result.text.length).toBeGreaterThan(0);
        });

        it('should handle errors gracefully', async () => {
            const invalidAudioData = new Float32Array(100); // Too short to be valid
            await expect(whisperWrapper.transcribe(invalidAudioData, {
                model: modelName,
                language: 'en',
                task: 'transcribe',
                useGPU: false
            })).rejects.toThrow();
        });
    });

    describe('Resource Management', () => {
        it('should release resources properly', () => {
            whisperWrapper.loadModel(modelPath);
            expect(() => {
                whisperWrapper.release();
            }).not.toThrow();
        });

        it('should handle multiple release calls safely', () => {
            whisperWrapper.release();
            expect(() => {
                whisperWrapper.release();
            }).not.toThrow();
        });
    });

    afterEach(() => {
        // Clean up after each test
        whisperWrapper.release();
    });
});