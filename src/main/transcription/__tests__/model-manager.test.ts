import { promises as fsPromises } from 'fs';
import { ModelManager } from '../model-manager';
import path from 'path';
import { app } from 'electron';

jest.mock('fs', () => ({
    promises: {
        mkdir: jest.fn().mockResolvedValue(undefined),
        access: jest.fn().mockResolvedValue(undefined),
        readFile: jest.fn().mockResolvedValue(Buffer.from('test')),
        unlink: jest.fn().mockResolvedValue(undefined),
        rename: jest.fn().mockResolvedValue(undefined),
        readdir: jest.fn().mockResolvedValue(['ggml-base.bin'])
    }
}));

jest.mock('crypto', () => ({
    createHash: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('mocked-hash')
    })
}));

jest.mock('electron', () => ({
    app: {
        getPath: jest.fn().mockReturnValue('/mock/path')
    }
}));

describe('ModelManager', () => {
    let modelManager: ModelManager;

    beforeEach(() => {
        jest.clearAllMocks();
        modelManager = new ModelManager();
    });

    it('should initialize with correct models directory', () => {
        expect(app.getPath).toHaveBeenCalledWith('userData');
        expect(fsPromises.mkdir).toHaveBeenCalledWith(
            path.join('/mock/path', 'models'),
            { recursive: true }
        );
    });

    it('should check if model is downloaded', async () => {
        const result = await modelManager.isModelDownloaded('tiny');
        expect(result).toBe(true);
        expect(fsPromises.access).toHaveBeenCalled();
    });

    it('should return false for unknown model when checking download status', async () => {
        const result = await modelManager.isModelDownloaded('unknown-model');
        expect(result).toBe(false);
    });

    it('should handle file access error when checking model download status', async () => {
        (fsPromises.access as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
        const result = await modelManager.isModelDownloaded('tiny');
        expect(result).toBe(false);
    });

    it('should return model info with download status', async () => {
        const modelInfo = await modelManager.getModelInfo('tiny');
        expect(modelInfo).toHaveProperty('downloaded', true);
        expect(modelInfo).toHaveProperty('name');
        expect(modelInfo).toHaveProperty('size');
    });

    it('should throw error for unknown model when getting info', async () => {
        await expect(modelManager.getModelInfo('unknown-model')).rejects.toThrow();
    });

    it('should list downloaded models', async () => {
        const models = await modelManager.listModels();
        expect(models).toEqual(['ggml-base.bin']);
        expect(fsPromises.readdir).toHaveBeenCalled();
    });

    it('should return empty array when listing models fails', async () => {
        (fsPromises.readdir as jest.Mock).mockRejectedValueOnce(new Error('Failed to read directory'));
        const models = await modelManager.listModels();
        expect(models).toEqual([]);
    });

    it('should get available models', () => {
        const models = modelManager.getAvailableModels();
        expect(models).toBeDefined();
        expect(Object.keys(models).length).toBeGreaterThan(0);
    });
});