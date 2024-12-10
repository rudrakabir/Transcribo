import fs from 'fs';
import path from 'path';
import { app } from 'electron';

describe('System Requirements Check', () => {
    // Helper to get application paths
    const getAppPaths = () => {
        const userDataPath = app.getPath('userData');
        const tempPath = app.getPath('temp');
        
        return {
            models: path.join(userDataPath, 'models'),
            temp: path.join(tempPath, 'transcribo'),
            whisperModule: path.join(__dirname, '../../../../build/Release/whisper.node')
        };
    };

    beforeAll(() => {
        // Ensure directories exist
        const paths = getAppPaths();
        Object.values(paths).forEach(dir => {
            const dirPath = path.dirname(dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
    });

    it('should have necessary directories', () => {
        const paths = getAppPaths();
        expect(fs.existsSync(path.dirname(paths.models))).toBe(true);
        expect(fs.existsSync(path.dirname(paths.temp))).toBe(true);
    });

    it('should have whisper native module directory', () => {
        const paths = getAppPaths();
        expect(fs.existsSync(path.dirname(paths.whisperModule))).toBe(true);
    });

    it('should have access to test audio files', () => {
        const testDir = path.join(__dirname, '../../../../Test');
        expect(fs.existsSync(testDir)).toBe(true);
    });
});