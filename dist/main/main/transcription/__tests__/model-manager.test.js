"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const model_manager_1 = require("../model-manager");
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
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
    let modelManager;
    beforeEach(() => {
        jest.clearAllMocks();
        modelManager = new model_manager_1.ModelManager();
    });
    it('should initialize with correct models directory', () => {
        expect(electron_1.app.getPath).toHaveBeenCalledWith('userData');
        expect(fs_1.promises.mkdir).toHaveBeenCalledWith(path_1.default.join('/mock/path', 'models'), { recursive: true });
    });
    it('should check if model is downloaded', async () => {
        const result = await modelManager.isModelDownloaded('tiny');
        expect(result).toBe(true);
        expect(fs_1.promises.access).toHaveBeenCalled();
    });
    it('should return false for unknown model when checking download status', async () => {
        const result = await modelManager.isModelDownloaded('unknown-model');
        expect(result).toBe(false);
    });
    it('should handle file access error when checking model download status', async () => {
        fs_1.promises.access.mockRejectedValueOnce(new Error('File not found'));
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
        expect(fs_1.promises.readdir).toHaveBeenCalled();
    });
    it('should return empty array when listing models fails', async () => {
        fs_1.promises.readdir.mockRejectedValueOnce(new Error('Failed to read directory'));
        const models = await modelManager.listModels();
        expect(models).toEqual([]);
    });
    it('should get available models', () => {
        const models = modelManager.getAvailableModels();
        expect(models).toBeDefined();
        expect(Object.keys(models).length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=model-manager.test.js.map