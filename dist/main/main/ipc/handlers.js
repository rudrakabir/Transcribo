"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIpcHandlers = setupIpcHandlers;
const electron_1 = require("electron");
const database_1 = require("../database");
const audio_files_1 = require("../file-system/audio-files");
const constants_1 = require("../../constants");
function setupIpcHandlers() {
    electron_1.ipcMain.handle(constants_1.IpcChannels.SELECT_FILES, async () => {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }]
        });
        const recordings = await Promise.all(result.filePaths.map(path => (0, audio_files_1.addAudioFile)(path)));
        return recordings.filter(r => r !== null);
    });
    electron_1.ipcMain.handle(constants_1.IpcChannels.SELECT_DIRECTORY, async () => {
        const result = await electron_1.dialog.showOpenDialog({ properties: ['openDirectory'] });
        return result.filePaths.length > 0 ? (0, audio_files_1.addAudioDirectory)(result.filePaths[0]) : [];
    });
    electron_1.ipcMain.handle(constants_1.IpcChannels.GET_FILE_LIST, audio_files_1.getAudioFiles);
    electron_1.ipcMain.handle(constants_1.IpcChannels.GET_SETTINGS, () => {
        return database_1.db.prepare('SELECT * FROM settings WHERE id = 1').get();
    });
    electron_1.ipcMain.handle(constants_1.IpcChannels.UPDATE_SETTINGS, (_, settings) => {
        return database_1.db.prepare(`
      UPDATE settings SET watchFolders = ?, whisperModel = ?, autoTranscribe = ?, 
      language = ?, maxConcurrentTranscriptions = ?, useGPU = ? WHERE id = 1
    `).run(JSON.stringify(settings.watchFolders), settings.whisperModel, settings.autoTranscribe ? 1 : 0, settings.language, settings.maxConcurrentTranscriptions, settings.useGPU ? 1 : 0);
    });
}
