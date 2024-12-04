"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSettingsHandlers = setupSettingsHandlers;
const electron_1 = require("electron");
const queries_1 = require("../database/queries");
function setupSettingsHandlers() {
    // Get settings
    electron_1.ipcMain.handle('getSettings', async () => {
        return (0, queries_1.getSettings)();
    });
    // Update settings
    electron_1.ipcMain.handle('updateSettings', async (_, settings) => {
        return (0, queries_1.updateSettings)(settings);
    });
    // Select directory (for watch folders)
    electron_1.ipcMain.handle('selectDirectory', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        if (!result.canceled) {
            return result.filePaths[0];
        }
        return null;
    });
}
//# sourceMappingURL=settings-handlers.js.map