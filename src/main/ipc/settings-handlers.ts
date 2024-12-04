import { ipcMain, dialog } from 'electron';
import { getSettings, updateSettings } from '../database/queries';

export function setupSettingsHandlers() {
  // Get settings
  ipcMain.handle('getSettings', async () => {
    return getSettings();
  });

  // Update settings
  ipcMain.handle('updateSettings', async (_, settings) => {
    return updateSettings(settings);
  });

  // Select directory (for watch folders)
  ipcMain.handle('selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (!result.canceled) {
      return result.filePaths[0];
    }
    return null;
  });
}