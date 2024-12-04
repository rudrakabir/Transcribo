import { app, BrowserWindow } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc/handlers';
import './database'; // Initialize database first

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Determine preload path based on environment
  const preloadPath = process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../../dist/preload.js')
    : path.join(__dirname, '../preload.js');

  console.log('Using preload script at:', preloadPath);

  mainWindow = new BrowserWindow({
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
};

app.whenReady().then(async () => {
  try {
    // Initialize handlers
    await setupIpcHandlers();
    
    // Create window
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Error during app initialization:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});