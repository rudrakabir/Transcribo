import db from './index';
import { Settings, AudioFile } from '../../shared/types';

interface DBSettings extends Omit<Settings, 'watchFolders' | 'autoTranscribe' | 'useGPU'> {
  watchFolders: string;
  autoTranscribe: number;
  useGPU: number;
}

interface DBAudioFile extends Omit<AudioFile, 'metadata' | 'createdAt' | 'modifiedAt'> {
  metadata: string;
  createdAt: string;
  modifiedAt: string;
}

export const getSettings = (): Settings => {
  const result = db.prepare('SELECT * FROM settings WHERE id = 1').get() as DBSettings;
  return {
    ...result,
    watchFolders: JSON.parse(result.watchFolders),
    autoTranscribe: Boolean(result.autoTranscribe),
    useGPU: Boolean(result.useGPU)
  };
};

export const updateSettings = (settings: Partial<Settings>): void => {
  const updates = Object.entries(settings)
    .map(([key, value]) => {
      if (key === 'watchFolders') return `${key} = '${JSON.stringify(value)}'`;
      if (typeof value === 'boolean') return `${key} = ${value ? 1 : 0}`;
      return `${key} = '${value}'`;
    })
    .join(', ');

  db.prepare(`UPDATE settings SET ${updates} WHERE id = 1`).run();
};

export const addAudioFile = (file: AudioFile): void => {
  const dbFile: DBAudioFile = {
    ...file,
    metadata: JSON.stringify(file.metadata || {}),
    createdAt: file.createdAt.toISOString(),
    modifiedAt: file.modifiedAt.toISOString()
  };

  const stmt = db.prepare(`
    INSERT INTO audio_files (id, path, fileName, size, duration, createdAt, modifiedAt, transcriptionStatus, metadata)
    VALUES (@id, @path, @fileName, @size, @duration, @createdAt, @modifiedAt, @transcriptionStatus, @metadata)
  `);

  stmt.run(dbFile);
};

export const getAudioFiles = (): AudioFile[] => {
  const files = db.prepare('SELECT * FROM audio_files').all() as DBAudioFile[];
  return files.map(file => ({
    ...file,
    metadata: JSON.parse(file.metadata || '{}'),
    createdAt: new Date(file.createdAt),
    modifiedAt: new Date(file.modifiedAt)
  }));
};

export const updateAudioFile = (id: string, updates: Partial<AudioFile>): void => {
  const validUpdates = Object.entries(updates)
    .filter(([key]) => key !== 'id')
    .map(([key, value]) => {
      if (key === 'metadata') return `${key} = '${JSON.stringify(value)}'`;
      if (value instanceof Date) return `${key} = '${value.toISOString()}'`;
      return `${key} = '${value}'`;
    })
    .join(', ');

  db.prepare(`UPDATE audio_files SET ${validUpdates} WHERE id = ?`).run(id);
};

export const deleteAudioFile = (id: string): void => {
  db.prepare('DELETE FROM audio_files WHERE id = ?').run(id);
};