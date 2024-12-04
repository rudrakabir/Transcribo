import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import https from 'https';
import { pipeline } from 'stream/promises';

interface ModelInfo {
  url: string;
  size: number;  // Expected file size in bytes
  hash: string;  // SHA256 hash for verification
}

export class ModelManager {
  private whisperDir: string;
  private downloadProgress: Map<string, number>;
  private readonly models: { [key: string]: ModelInfo };

  constructor() {
    this.whisperDir = path.join(process.cwd(), 'native', 'whisper', 'models');
    this.downloadProgress = new Map();
    
    // Model information including URLs, sizes, and hashes
    this.models = {
      'tiny': {
        url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
        size: 75_000_000,
        hash: 'be07e048e1e599ad46341c8d2a135645097a538221678b7acdd1b1919c6e1b21'
      },
      'base': {
        url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
        size: 142_000_000,
        hash: '137c40403d78fd54d454da0f9bd998f78703390e4ee70ffc579f6c98c0e2486b'
      },
      'small': {
        url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
        size: 466_000_000,
        hash: '55356645c8d420e96a62f14eac39c7fc3dfc4c405c5c9bf94f901f8a2c22a44a'
      },
      'medium': {
        url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
        size: 1_500_000_000,
        hash: '5cf0ab17c123d9aa324c5f6d3e43bd0281c1f0696979f8500aa002553be8a8c8'
      },
      'large-v3': {
        url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
        size: 2_900_000_000,
        hash: '1f37e88468a166f1a87c1087b84c5b52e45b4e542729677d16404c1afcb11f13'
      }
    };
  }

  public async downloadModel(
    modelName: string, 
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    const model = this.models[modelName];
    if (!model) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    const modelPath = path.join(this.whisperDir, `ggml-${modelName}.bin`);
    const tempPath = `${modelPath}.download`;
    
    try {
      // Create models directory if it doesn't exist
      await fs.mkdir(this.whisperDir, { recursive: true });

      return new Promise((resolve, reject) => {
        const fileStream = createWriteStream(tempPath);
        let downloaded = 0;

        https.get(model.url, (response) => {
          if (response.statusCode !== 200) {
            fileStream.close();
            reject(new Error(`Failed to download model: ${response.statusMessage}`));
            return;
          }

          const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
          if (totalBytes === 0) {
            fileStream.close();
            reject(new Error('Invalid content length received from server'));
            return;
          }

          response.on('data', (chunk: Buffer) => {
            downloaded += chunk.length;
            const progress = (downloaded / totalBytes) * 100;
            this.downloadProgress.set(modelName, progress);
            progressCallback?.(progress);
          });

          fileStream.on('finish', async () => {
            fileStream.close();
            
            try {
              // Verify file size
              const stats = await fs.stat(tempPath);
              if (Math.abs(stats.size - model.size) > 1000000) {
                await fs.unlink(tempPath);
                reject(new Error(`Downloaded file size mismatch. Expected ~${model.size} bytes, got ${stats.size} bytes`));
                return;
              }

              // Move temp file to final location
              await fs.rename(tempPath, modelPath);
              this.downloadProgress.delete(modelName);
              progressCallback?.(100);
              resolve();
            } catch (error) {
              reject(error);
            }
          });

          fileStream.on('error', async (error) => {
            try {
              await fs.unlink(tempPath);
            } catch {} // Ignore cleanup errors
            reject(error);
          });

          response.pipe(fileStream);
        }).on('error', async (error) => {
          try {
            await fs.unlink(tempPath);
          } catch {} // Ignore cleanup errors
          reject(error);
        });
      });

    } catch (error) {
      // Clean up temp file if download failed
      try {
        await fs.unlink(tempPath);
      } catch {} // Ignore cleanup errors
      
      // Clear progress on error
      this.downloadProgress.delete(modelName);
      progressCallback?.(0);
      
      throw error;
    }
  }

  public getDownloadProgress(modelName: string): number {
    return this.downloadProgress.get(modelName) || 0;
  }

  public async isModelDownloaded(modelName: string): Promise<boolean> {
    const modelPath = path.join(this.whisperDir, `ggml-${modelName}.bin`);
    try {
      const stats = await fs.stat(modelPath);
      const expectedSize = this.models[modelName]?.size;
      
      // Verify file exists and size is approximately correct
      return stats.size > 0 && Math.abs(stats.size - expectedSize) <= 1000000;
    } catch {
      return false;
    }
  }

  public async getAvailableModels(): Promise<string[]> {
    const downloaded = await Promise.all(
      Object.keys(this.models).map(async model => ({
        name: model,
        downloaded: await this.isModelDownloaded(model)
      }))
    );
    return downloaded.filter(m => m.downloaded).map(m => m.name);
  }

  public getModelPath(modelName: string): string {
    return path.join(this.whisperDir, `ggml-${modelName}.bin`);
  }

  public getModelInfo(modelName: string): ModelInfo | null {
    return this.models[modelName] || null;
  }
}