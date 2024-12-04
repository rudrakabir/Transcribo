"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const handlers_1 = require("./ipc/handlers");
require("./database"); // Initialize database first
let mainWindow = null;
const createWindow = () => {
    // Determine preload path based on environment
    const preloadPath = process.env.NODE_ENV === 'development'
        ? path_1.default.join(__dirname, '../../dist/preload.js')
        : path_1.default.join(__dirname, '../preload.js');
    console.log('Using preload script at:', preloadPath);
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath,
        },
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../renderer/index.html'));
    }
};
electron_1.app.whenReady().then(async () => {
    try {
        // Initialize handlers
        await (0, handlers_1.setupIpcHandlers)();
        // Create window
        createWindow();
        electron_1.app.on('activate', () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    }
    catch (error) {
        console.error('Error during app initialization:', error);
        electron_1.app.quit();
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
//# sourceMappingURL=main.js.map