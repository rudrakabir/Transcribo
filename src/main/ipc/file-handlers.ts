import { ipcMain, dialog } from 'electron';
import { addAudioFile, getAudioFiles, updateAudioFile, deleteAudioFile } from '../database/queries';
import { generateFileMetadata } from '../file-system/metadata';
import { AudioFile } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export function setupFileHandlers() {
  ipcMain.handle('selectFiles', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'm4a', 'ogg', 'flac'] }
      ]
    });

    if (!result.canceled) {
      const files = await Promise.all(result.filePaths.map(async (filePath) => {
        const metadata = await generateFileMetadata(filePath);
        const file: AudioFile = {
          id: uuidv4(),
          path: filePath,
          fileName: path.basename(filePath),
          size: metadata.size,
          duration: metadata.duration,
          createdAt: new Date(),
          modifiedAt: new Date(),
          transcriptionStatus: 'unprocessed' as const,
          metadata
        };
        addAudioFile(file);
        return file;
      }));
      return files;
    }
    return [];
  });

  ipcMain.handle('getAudioFiles', async () => {
    return getAudioFiles();
  });

  ipcMain.handle('getAudioFile', async (_, id) => {
    const files = getAudioFiles();
    return files.find(file => file.id === id) || null;
  });

  ipcMain.handle('updateAudioFile', async (_, id, updates) => {
    return updateAudioFile(id, updates);
  });

  ipcMain.handle('deleteAudioFile', async (_, id) => {
    return deleteAudioFile(id);
  });
}