import path from 'path';
import { readdir, stat } from 'fs/promises';
import { AudioFile } from '../../shared/types';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import { generateFileMetadata } from './metadata';

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac']);

export async function scanDirectory(dirPath: string): Promise<AudioFile[]> {
  const files = await readdir(dirPath);
  const audioFiles: AudioFile[] = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const fileExt = path.extname(file).toLowerCase();

    if (AUDIO_EXTENSIONS.has(fileExt)) {
      const metadata = await generateFileMetadata(filePath);
      const stats = await stat(filePath);

      const audioFile: AudioFile = {
        id: uuidv4(),
        path: filePath,
        fileName: file,
        size: stats.size,
        duration: metadata.duration,
        createdAt: new Date(),
        modifiedAt: new Date(),
        transcriptionStatus: 'unprocessed',
        metadata
      };

      audioFiles.push(audioFile);
    }
  }

  return audioFiles;
}