import { promises as fs } from 'fs';
import * as path from 'path';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { WhisperService } from '../whisper';
import { checkSystemRequirements } from './utils/system-checks';

describe('Whisper Integration Tests', () => {
    let whisperService: WhisperService;
    const modelName = 'ggml-tiny';
    const testAudioPath = path.join(__dirname, '../../../native/whisper/samples/jfk.mp3');

    beforeAll(async () => {
        // Ensure system requirements are met
        await checkSystemRequirements();
        
        // Initialize the WhisperService
        whisperService = new WhisperService();
        // Initialize with tiny model for quick tests
        await whisperService.initialize(modelName);
    });

    it('should load the model successfully', async () => {
        // The initialize call in beforeAll already tests this
        expect(whisperService).toBeDefined();
    });

    it('should transcribe the JFK sample audio file', async () => {
        // Ensure test file exists
        const fileExists = await fs.access(testAudioPath)
            .then(() => true)
            .catch(() => false);
            
        expect(fileExists).toBe(true);
        console.log('Testing transcription of:', testAudioPath);

        // Perform transcription
        const result = await whisperService.transcribe(
            testAudioPath,
            {
                model: modelName,
                language: 'en',
                task: 'transcribe',
                useGPU: false
            },
            (progress) => {
                console.log(`Transcription progress: ${progress.progress}%, Time elapsed: ${progress.timeElapsed}ms`);
            }
        );
        
        // Verify output
        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.segments).toBeDefined();
        expect(Array.isArray(result.segments)).toBe(true);
        
        // Log the transcription for manual verification
        console.log('Transcription result:', result.text);
    });

    afterAll(async () => {
        // Cleanup
        await whisperService.cleanup();
    });
});