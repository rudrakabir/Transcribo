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
        size: 75 * 1024 * 1024,
        url: `${BASE_URL}/ggml-tiny.bin`,
        hash: 'bd577a113a864445d4c299885e0cb97d4ba92b5f',
        downloaded: false,
        downloadProgress: 0,
        downloadStatus: 'pending'
    },
    'tiny.en': {
        name: 'ggml-tiny.en.bin',
        size: 77691713, // Updated to server-reported size
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
        downloadStatus: 'pending'
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
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
class ModelManager {
    constructor() {
        this.downloading = false;
        this.modelsDir = path_1.default.join(electron_1.app.getPath('userData'), 'models');
        fs_1.promises.mkdir(this.modelsDir, { recursive: true }).catch(console.error);
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async isModelDownloaded(modelName) {
        const modelInfo = MODELS[modelName];
        if (!modelInfo)
            return false;
        const modelPath = path_1.default.join(this.modelsDir, modelInfo.name);
        try {
            await fs_1.promises.access(modelPath);
            return await this.verifyModel(modelPath, modelInfo.hash);
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
        let tempDestination = null;
        let attempt = 0;
        while (attempt < MAX_RETRIES) {
            try {
                tempDestination = `${modelPath}.tmp`;
                console.log(`Starting download of ${model.name} (Attempt ${attempt + 1}/${MAX_RETRIES})`);
                const downloadedSize = await this.downloadFile(model.url, tempDestination, progressCallback);
                console.log('Download completed, verifying file...');
                const isValid = await this.verifyModel(tempDestination, model.hash);
                if (!isValid) {
                    throw new Error('Model verification failed after download');
                }
                await fs_1.promises.rename(tempDestination, modelPath);
                console.log('Model verification successful');
                return;
            }
            catch (error) {
                console.error(`Attempt ${attempt + 1} failed:`, error);
                if (tempDestination) {
                    await fs_1.promises.unlink(tempDestination).catch(() => { });
                }
                attempt++;
                if (attempt < MAX_RETRIES) {
                    console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
                    await this.delay(RETRY_DELAY);
                }
                else {
                    throw error;
                }
            }
            finally {
                if (attempt === MAX_RETRIES - 1) {
                    this.downloading = false;
                }
            }
        }
    }
    async downloadFile(url, destination, progressCallback) {
        let fileHandle = await fs_1.promises.open(destination, 'w');
        let totalDownloaded = 0;
        let lastLoggedProgress = 0;
        let contentLength;
        const downloadWithRedirects = async (currentUrl, redirectCount = 0) => {
            if (redirectCount > 5) {
                throw new Error('Too many redirects');
            }
            return new Promise((resolve, reject) => {
                console.log(`Downloading from: ${currentUrl}`);
                const request = https_1.default.get(currentUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Transcribo)',
                        'Accept': '*/*'
                    }
                }, async (response) => {
                    console.log(`Response status: ${response.statusCode}`);
                    console.log('Response headers:', response.headers);
                    if (response.statusCode === 302 || response.statusCode === 301) {
                        const redirectUrl = response.headers.location;
                        if (!redirectUrl) {
                            reject(new Error('Redirect location not found'));
                            return;
                        }
                        try {
                            const size = await downloadWithRedirects(redirectUrl, redirectCount + 1);
                            resolve(size);
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
                    contentLength = parseInt(response.headers['content-length'] || '0', 10);
                    console.log(`Server reported size: ${contentLength} bytes`);
                    const writeStream = fileHandle.createWriteStream();
                    response.on('data', chunk => {
                        totalDownloaded += chunk.length;
                        writeStream.write(chunk);
                        if (contentLength && progressCallback) {
                            const currentProgress = totalDownloaded / contentLength;
                            const progressPercent = Math.floor(currentProgress * 100);
                            if (progressPercent >= lastLoggedProgress + 5) {
                                console.log(`Download progress: ${progressPercent}% (${totalDownloaded} / ${contentLength} bytes)`);
                                lastLoggedProgress = progressPercent;
                            }
                            progressCallback(Math.min(currentProgress, 1));
                        }
                    });
                    response.on('end', () => {
                        writeStream.end(() => {
                            console.log(`Download completed. Total downloaded: ${totalDownloaded} bytes`);
                            resolve(totalDownloaded);
                        });
                    });
                    writeStream.on('error', error => {
                        console.error('Write stream error:', error);
                        reject(error);
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
            const downloadedSize = await downloadWithRedirects(url);
            await fileHandle.close();
            return downloadedSize;
        }
        catch (error) {
            await fileHandle.close();
            throw error;
        }
    }
    async verifyModel(modelPath, expectedHash) {
        try {
            const fileBuffer = await fs_1.promises.readFile(modelPath);
            console.log(`Verifying model file size: ${fileBuffer.length} bytes`);
            const hash = (0, crypto_1.createHash)('sha1').update(fileBuffer).digest('hex');
            console.log(`Calculated hash: ${hash}`);
            console.log(`Expected hash:   ${expectedHash}`);
            return hash === expectedHash;
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