"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelManager = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const https_1 = __importDefault(require("https"));
const crypto_1 = require("crypto");
const MODELS = {
    'tiny': {
        name: 'ggml-tiny.bin',
        size: 75000000,
        url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
        hash: '5a42fec86d47615ba1503b334f55460d',
        downloaded: false,
        downloadProgress: 0,
        downloadStatus: 'pending'
    },
    'base': {
        name: 'ggml-base.bin',
        size: 142000000,
        url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
        hash: '12858027fd767b6929a17c6cc816c11c',
        downloaded: false,
        downloadProgress: 0,
        downloadStatus: 'pending'
    },
    'small': {
        name: 'ggml-small.bin',
        size: 466000000,
        url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
        hash: '221ea96b9274dc3fdd20671a87552c45',
        downloaded: false,
        downloadProgress: 0,
        downloadStatus: 'pending'
    },
    'medium': {
        name: 'ggml-medium.bin',
        size: 1500000000,
        url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
        hash: '5cf52a471388ce5a7785c2a2c5b2e45e',
        downloaded: false,
        downloadProgress: 0,
        downloadStatus: 'pending'
    }
};
class ModelManager {
    constructor() {
        this.modelsDir = path_1.default.join(electron_1.app.getPath('userData'), 'models');
        fs_1.promises.mkdir(this.modelsDir, { recursive: true }).catch(console.error);
    }
    async isModelDownloaded(modelName) {
        const modelInfo = MODELS[modelName];
        if (!modelInfo)
            return false;
        const modelPath = path_1.default.join(this.modelsDir, modelInfo.name);
        try {
            await fs_1.promises.access(modelPath);
            return true;
        }
        catch {
            return false;
        }
    }
    async getModelInfo(modelName) {
        const modelInfo = MODELS[modelName];
        if (!modelInfo) {
            throw new Error(`Unknown model: ${modelName}`);
        }
        const downloaded = await this.isModelDownloaded(modelName);
        return { ...modelInfo, downloaded };
    }
    async downloadModel(modelName, progressCallback) {
        const model = MODELS[modelName];
        if (!model) {
            throw new Error(`Unknown model: ${modelName}`);
        }
        const modelPath = path_1.default.join(this.modelsDir, model.name);
        // Type guard for hash and url
        if (!model.hash || !model.url) {
            throw new Error('Model hash or URL not found');
        }
        if (await this.verifyModel(modelPath, model.hash)) {
            return;
        }
        await this.downloadFile(model.url, modelPath, model.size, progressCallback);
        if (!await this.verifyModel(modelPath, model.hash)) {
            await fs_1.promises.unlink(modelPath);
            throw new Error('Model verification failed after download');
        }
    }
    async downloadFile(url, destination, expectedSize, progressCallback) {
        return new Promise((resolve, reject) => {
            const file = fs_1.promises.open(destination, 'w');
            let downloadedBytes = 0;
            https_1.default.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Download failed with status ${response.statusCode}`));
                    return;
                }
                response.on('data', async (chunk) => {
                    try {
                        const fileHandle = await file;
                        await fileHandle.write(chunk);
                        downloadedBytes += chunk.length;
                        if (progressCallback) {
                            progressCallback(downloadedBytes / expectedSize);
                        }
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                response.on('end', () => resolve());
                response.on('error', reject);
            });
        });
    }
    async verifyModel(modelPath, expectedHash) {
        try {
            const fileBuffer = await fs_1.promises.readFile(modelPath);
            const hash = (0, crypto_1.createHash)('md5').update(fileBuffer).digest('hex');
            return hash === expectedHash;
        }
        catch {
            return false;
        }
    }
    async listModels() {
        try {
            const files = await fs_1.promises.readdir(this.modelsDir);
            return files.filter(file => file.endsWith('.bin'));
        }
        catch {
            return [];
        }
    }
    async deleteModel(modelName) {
        const modelPath = path_1.default.join(this.modelsDir, `${modelName}.bin`);
        await fs_1.promises.unlink(modelPath);
    }
    getAvailableModels() {
        return MODELS;
    }
}
exports.ModelManager = ModelManager;
//# sourceMappingURL=model-manager.js.map