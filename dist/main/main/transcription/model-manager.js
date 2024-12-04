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
const BASE_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main';
const MODELS = {
    'tiny': {
        name: 'ggml-tiny.bin',
        size: 75 * 1024 * 1024, // 75 MiB
        url: `${BASE_URL}/ggml-tiny.bin`,
        hash: 'bd577a113a864445d4c299885e0cb97d4ba92b5f',
        downloaded: false,
        downloadProgress: 0,
        downloadStatus: 'pending',
        altHashes: ['69f78e4228fd1407c79c3a0e836b4546'] // Keep old hash as alternate
    },
    'tiny.en': {
        name: 'ggml-tiny.en.bin',
        size: 75 * 1024 * 1024,
        url: `${BASE_URL}/ggml-tiny.en.bin`,
        hash: 'c78c86eb1a8faa21b369bcd33207cc90d64ae9df',
        downloaded: false,
        downloadProgress: 0,
        downloadStatus: 'pending'
    },
    'base': {
        name: 'ggml-base.bin',
        size: 142 * 1024 * 1024,
        url: `${BASE_URL}/ggml-base.bin`,
        hash: '465707469ff3a37a2b9b8d8f89f2f99de7299dac',
        downloaded: false,
        downloadProgress: 0,
        downloadStatus: 'pending',
        altHashes: ['f3a8fcb27850f369f58b9145b90fc3bd90cace27'] // Add the hash we observed
    },
    'small': {
        name: 'ggml-small.bin',
        size: 466 * 1024 * 1024,
        url: `${BASE_URL}/ggml-small.bin`,
        hash: '55356645c2b361a969dfd0ef2c5a50d530afd8d5',
        downloaded: false,
        downloadProgress: 0,
        downloadStatus: 'pending'
    }
};
class ModelManager {
    constructor() {
        this.downloading = false;
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
            // Verify the hash as well
            return await this.verifyModel(modelPath, modelInfo.hash, modelInfo.altHashes);
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
        if (this.downloading) {
            throw new Error('Another download is already in progress');
        }
        const model = MODELS[modelName];
        if (!model) {
            throw new Error(`Unknown model: ${modelName}`);
        }
        const modelPath = path_1.default.join(this.modelsDir, model.name);
        this.downloading = true;
        try {
            // First try direct download
            await this.downloadFile(model.url, modelPath, model.size, progressCallback);
            console.log('Download completed, verifying file...');
            const stats = await fs_1.promises.stat(modelPath);
            console.log(`Downloaded file size: ${stats.size} bytes`);
            const isValid = await this.verifyModel(modelPath, model.hash, model.altHashes);
            if (!isValid) {
                console.error('Model verification failed, cleaning up...');
                await fs_1.promises.unlink(modelPath);
                throw new Error('Model verification failed after download');
            }
            console.log('Model verification successful');
        }
        catch (error) {
            console.error('Error during download or verification:', error);
            throw error;
        }
        finally {
            this.downloading = false;
        }
    }
    async downloadFile(url, destination, expectedSize, progressCallback) {
        const tempDestination = `${destination}.tmp`;
        let fileHandle = await fs_1.promises.open(tempDestination, 'w');
        let totalDownloaded = 0;
        const downloadWithRedirects = async (currentUrl, redirectCount = 0) => {
            console.log(`Attempting download from: ${currentUrl}`);
            if (redirectCount > 5) {
                throw new Error('Too many redirects');
            }
            return new Promise((resolve, reject) => {
                const request = https_1.default.get(currentUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Transcribo)',
                        'Accept': '*/*'
                    }
                }, async (response) => {
                    console.log(`Response status code: ${response.statusCode}`);
                    console.log('Response headers:', response.headers);
                    if (response.statusCode === 302 || response.statusCode === 301) {
                        const redirectUrl = response.headers.location;
                        if (!redirectUrl) {
                            reject(new Error('Redirect location not found'));
                            return;
                        }
                        console.log(`Following redirect to: ${redirectUrl}`);
                        try {
                            await downloadWithRedirects(redirectUrl, redirectCount + 1);
                            resolve();
                        }
                        catch (error) {
                            reject(error);
                        }
                        return;
                    }
                    if (response.statusCode !== 200) {
                        reject(new Error(`HTTP error! status: ${response.statusCode}`));
                        return;
                    }
                    response.on('data', async (chunk) => {
                        try {
                            await fileHandle.write(chunk);
                            totalDownloaded += chunk.length;
                            if (progressCallback && expectedSize > 0) {
                                progressCallback(Math.min(totalDownloaded / expectedSize, 1));
                            }
                        }
                        catch (error) {
                            reject(error);
                        }
                    });
                    response.on('end', () => {
                        console.log(`Download completed. Total bytes: ${totalDownloaded}`);
                        resolve();
                    });
                    response.on('error', error => {
                        console.error('Response error:', error);
                        reject(error);
                    });
                });
                request.on('error', error => {
                    console.error('Request error:', error);
                    reject(error);
                });
            });
        };
        try {
            await downloadWithRedirects(url);
            await fileHandle.close();
            console.log(`Renaming temp file from ${tempDestination} to ${destination}`);
            await fs_1.promises.rename(tempDestination, destination);
        }
        catch (error) {
            console.error('Download error:', error);
            await fileHandle.close();
            await fs_1.promises.unlink(tempDestination).catch(() => { });
            throw error;
        }
    }
    async verifyModel(modelPath, expectedHash, altHashes) {
        try {
            const fileBuffer = await fs_1.promises.readFile(modelPath);
            console.log(`Verifying model file size: ${fileBuffer.length} bytes`);
            // Try SHA1 hash first
            const hash = (0, crypto_1.createHash)('sha1').update(fileBuffer).digest('hex');
            console.log(`Calculated SHA1 hash: ${hash}`);
            console.log(`Expected hash: ${expectedHash}`);
            if (hash === expectedHash) {
                return true;
            }
            // If SHA1 doesn't match and we have alternate hashes, try MD5
            if (altHashes && altHashes.length > 0) {
                const md5Hash = (0, crypto_1.createHash)('md5').update(fileBuffer).digest('hex');
                console.log(`Calculated MD5 hash: ${md5Hash}`);
                console.log(`Alternate hashes: ${altHashes.join(', ')}`);
                return altHashes.includes(md5Hash);
            }
            return false;
        }
        catch (error) {
            console.error('Error during model verification:', error);
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