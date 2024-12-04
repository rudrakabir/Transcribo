import { app } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';
import https from 'https';
import { createHash } from 'crypto';
import { ModelInfo } from '../../shared/types';

const MODELS: Record<string, ModelInfo> = {
  'tiny': {
    name: 'ggml-tiny.bin',
    size: 75_000_000,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    hash: '5a42fec86d47615ba1503b334f55460d',
    downloaded: false,
    downloadProgress: 0,
    downloadStatus: 'pending'
  },
  'base': {
    name: 'ggml-base.bin',
    size: 142_000_000,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    hash: '12858027fd767b6929a17c6cc816c11c',
    downloaded: false,
    downloadProgress: 0,
    downloadStatus: 'pending'
  },
  'small': {
    name: 'ggml-small.bin',
    size: 466_000_000,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    hash: '221ea96b9274dc3fdd20671a87552c45',
    downloaded: false,
    downloadProgress: 0,
    downloadStatus: 'pending'
  },
  'medium': {
    name: 'ggml-medium.bin',
    size: 1_500_000_000,
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
    hash: '5cf52a471388ce5a7785c2a2c5b2e45e',
    downloaded: false,
    downloadProgress: 0,
    downloadStatus: 'pending'
  }
};

export class ModelManager {
  private modelsDir: string;

  constructor() {
    this.modelsDir = path.join(app.getPath('userData'), 'models');
    fs.mkdir(this.modelsDir, { recursive: true }).catch(console.error);
  }

  public async isModelDownloaded(modelName: string): Promise<boolean> {
    const modelInfo = MODELS[modelName];
    if (!modelInfo) return false;
    
    const modelPath = path.join(this.modelsDir, modelInfo.name);
    try {
      await fs.access(modelPath);
      return true;
    } catch {
      return false;
    }
  }

  public async getModelInfo(modelName: string): Promise<ModelInfo> {
    const modelInfo = MODELS[modelName];
    if (!modelInfo) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    const downloaded = await this.isModelDownloaded(modelName);
    return { ...modelInfo, downloaded };
  }

  public async downloadModel(
    modelName: keyof typeof MODELS,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    const model = MODELS[modelName];
    if (!model) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    const modelPath = path.join(this.modelsDir, model.name);

    // Type guard for hash and url
    if (!model.hash || !model.url) {
      throw new Error('Model hash or URL not found');
    }

    if (await this.verifyModel(modelPath, model.hash)) {
      return;
    }

    await this.downloadFile(model.url, modelPath, model.size, progressCallback);

    if (!await this.verifyModel(modelPath, model.hash)) {
      await fs.unlink(modelPath);
      throw new Error('Model verification failed after download');
    }
  }

  private async downloadFile(
    url: string,
    destination: string,
    expectedSize: number,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    const tempDestination = `${destination}.tmp`;
    const fileHandle = await fs.open(tempDestination, 'w');

    const downloadWithRedirects = async (currentUrl: string, redirectCount = 0): Promise<void> => {
      if (redirectCount > 5) {
        throw new Error('Too many redirects');
      }

      return new Promise((resolve, reject) => {
        const request = https.get(currentUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Transcribo)',
            'Accept': '*/*'
          }
        }, async response => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            const redirectUrl = response.headers.location;
            if (!redirectUrl) {
              reject(new Error('Redirect location not found'));
              return;
            }
            
            try {
              await downloadWithRedirects(redirectUrl, redirectCount + 1);
              resolve();
            } catch (error) {
              reject(error);
            }
            return;
          }

          if (response.statusCode !== 200) {
            reject(new Error(`HTTP error! status: ${response.statusCode}`));
            return;
          }

          let downloadedBytes = 0;

          response.on('data', async chunk => {
            try {
              await fileHandle.write(chunk);
              downloadedBytes += chunk.length;
              if (progressCallback) {
                progressCallback(downloadedBytes / expectedSize);
              }
            } catch (error) {
              reject(error);
            }
          });

          response.on('end', () => resolve());
          response.on('error', reject);
        });

        request.on('error', reject);
      });
    };

    try {
      await downloadWithRedirects(url);
      await fileHandle.close();
      await fs.rename(tempDestination, destination);
    } catch (error) {
      await fileHandle.close();
      await fs.unlink(tempDestination).catch(() => {}); // Clean up temp file
      throw error;
    }
  }

  private async verifyModel(modelPath: string, expectedHash: string): Promise<boolean> {
    try {
      const fileBuffer = await fs.readFile(modelPath);
      const hash = createHash('md5').update(fileBuffer).digest('hex');
      return hash === expectedHash;
    } catch {
      return false;
    }
  }

  public async listModels(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.modelsDir);
      return files.filter(file => file.endsWith('.bin'));
    } catch {
      return [];
    }
  }

  public async deleteModel(modelName: string): Promise<void> {
    const modelPath = path.join(this.modelsDir, `${modelName}.bin`);
    await fs.unlink(modelPath);
  }

  public getAvailableModels(): Record<string, ModelInfo> {
    return MODELS;
  }
}