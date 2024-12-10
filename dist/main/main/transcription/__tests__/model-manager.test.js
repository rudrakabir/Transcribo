"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const model_manager_1 = require("../model-manager");
// Simple mock of fs promises
globals_1.jest.mock('fs', () => ({
    promises: {
        access: globals_1.jest.fn(),
        mkdir: globals_1.jest.fn(),
        writeFile: globals_1.jest.fn(),
        readFile: globals_1.jest.fn(() => Buffer.from('')),
        unlink: globals_1.jest.fn(),
        open: globals_1.jest.fn(() => Promise.resolve({ close: globals_1.jest.fn() })),
        readdir: globals_1.jest.fn(() => Promise.resolve([])),
        rename: globals_1.jest.fn()
    }
}));
(0, globals_1.describe)('ModelManager', () => {
    let modelManager;
    const fs = require('fs').promises;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        modelManager = new model_manager_1.ModelManager();
    });
    (0, globals_1.it)('should check if model is downloaded', async () => {
        await modelManager.isModelDownloaded('tiny');
        (0, globals_1.expect)(fs.access).toHaveBeenCalled();
    });
    (0, globals_1.it)('should handle model downloads', async () => {
        fs.readFile.mockResolvedValueOnce(Buffer.from('test'));
        const progress = globals_1.jest.fn();
        await modelManager.downloadModel('tiny', progress);
        (0, globals_1.expect)(fs.writeFile).toHaveBeenCalled();
        (0, globals_1.expect)(progress).toHaveBeenCalled();
    });
    (0, globals_1.it)('should handle file operations errors', async () => {
        fs.access.mockRejectedValueOnce(new Error('File not found'));
        const isDownloaded = await modelManager.isModelDownloaded('tiny');
        (0, globals_1.expect)(isDownloaded).toBe(false);
    });
    (0, globals_1.it)('should list available models', () => {
        const models = modelManager.getAvailableModels();
        (0, globals_1.expect)(models).toBeDefined();
        (0, globals_1.expect)(Object.keys(models).length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('should delete models', async () => {
        await modelManager.deleteModel('tiny');
        (0, globals_1.expect)(fs.unlink).toHaveBeenCalled();
    });
});
//# sourceMappingURL=model-manager.test.js.map