import { promises as fs } from 'fs';
import { statSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { app } from 'electron';
import { createHash } from 'crypto';
import { AudioMetadata } from '../../shared/types';

export class AudioProcessor {
  private tmpDir: string;

  constructor() {
    this.tmpDir = path.join(app.getPath('temp'), 'transcribo');
    // Ensure temp directory exists
    fs.mkdir(this.tmpDir, { recursive: true }).catch(console.error);
  }

  public async preprocessAudio(filePath: string): Promise<{ 
    audioData: Float32Array; 
    metadata: AudioMetadata;
  }> {
    // Get file hash for temp file naming
    const fileHash = await this.getFileHash(filePath);
    const tempWavPath = path.join(this.tmpDir, `${fileHash}.wav`);

    try {
      // Convert to WAV if needed
      await this.convertToWav(filePath, tempWavPath);

      // Get audio metadata
      const metadata = await this.getAudioMetadata(tempWavPath);

      // Read and convert to float32 array
      const audioData = await this.readAudioData(tempWavPath);

      // Cleanup temp file
      await fs.unlink(tempWavPath).catch(console.error);

      return { audioData, metadata };
    } catch (error) {
      // Cleanup on error
      await fs.unlink(tempWavPath).catch(console.error);
      throw error;
    }
  }

  private async getFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return createHash('md5').update(fileBuffer).digest('hex');
  }

  private async convertToWav(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-ar', '16000',  // Sample rate required by Whisper
        '-ac', '1',      // Mono audio
        '-c:a', 'pcm_s16le',  // 16-bit PCM
        outputPath
      ]);

      let errorOutput = '';
      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg conversion failed: ${errorOutput}`));
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  private async getAudioMetadata(filePath: string): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ]);

      let output = '';
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(output);
            const audioStream = data.streams.find((stream: { codec_type: string }) => 
              stream.codec_type === 'audio'
            );
            
            if (!audioStream) {
              throw new Error('No audio stream found');
            }

            const stats = statSync(filePath);
            
            resolve({
              format: data.format.format_name,
              size: stats.size,
              duration: parseFloat(data.format.duration),
              sampleRate: parseInt(audioStream.sample_rate),
              channels: audioStream.channels,
              bitrate: audioStream.bit_rate ? parseInt(audioStream.bit_rate) : undefined,
              codec: audioStream.codec_name
            });
          } catch (error) {
            reject(new Error('Failed to parse audio metadata'));
          }
        } else {
          reject(new Error('FFprobe analysis failed'));
        }
      });

      ffprobe.on('error', reject);
    });
  }

  private async readAudioData(wavPath: string): Promise<Float32Array> {
    const buffer = await fs.readFile(wavPath);
    
    // Skip WAV header (44 bytes) and convert to float32
    const samples = new Int16Array(
      buffer.buffer,
      44,
      (buffer.length - 44) / 2
    );

    // Convert to float32 (-1.0 to 1.0 range)
    const float32Data = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      float32Data[i] = samples[i] / 32768.0;
    }

    return float32Data;
  }
}