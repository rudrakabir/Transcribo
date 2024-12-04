"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupFileHandlers = setupFileHandlers;
const electron_1 = require("electron");
const queries_1 = require("../database/queries");
const metadata_1 = require("../file-system/metadata");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
function setupFileHandlers() {
    electron_1.ipcMain.handle('selectFiles', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Audio Files', extensions: ['mp3', 'wav', 'm4a', 'ogg', 'flac'] }
            ]
        });
        if (!result.canceled) {
            const files = await Promise.all(result.filePaths.map(async (filePath) => {
                const metadata = await (0, metadata_1.generateFileMetadata)(filePath);
                const file = {
                    id: (0, uuid_1.v4)(),
                    path: filePath,
                    fileName: path_1.default.basename(filePath),
                    size: metadata.size,
                    duration: metadata.duration,
                    createdAt: new Date(),
                    modifiedAt: new Date(),
                    transcriptionStatus: 'unprocessed',
                    metadata
                };
                (0, queries_1.addAudioFile)(file);
                return file;
            }));
            return files;
        }
        return [];
    });
    electron_1.ipcMain.handle('getAudioFiles', async () => {
        return (0, queries_1.getAudioFiles)();
    });
    electron_1.ipcMain.handle('getAudioFile', async (_, id) => {
        const files = (0, queries_1.getAudioFiles)();
        return files.find(file => file.id === id) || null;
    });
    electron_1.ipcMain.handle('updateAudioFile', async (_, id, updates) => {
        return (0, queries_1.updateAudioFile)(id, updates);
    });
    electron_1.ipcMain.handle('deleteAudioFile', async (_, id) => {
        return (0, queries_1.deleteAudioFile)(id);
    });
}
//# sourceMappingURL=file-handlers.js.map