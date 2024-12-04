"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'transcribo.db');
const db = new better_sqlite3_1.default(dbPath);
// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS audio_files (
    id TEXT PRIMARY KEY,
    path TEXT UNIQUE NOT NULL,
    fileName TEXT NOT NULL,
    size INTEGER NOT NULL,
    duration INTEGER,
    createdAt TEXT NOT NULL,
    modifiedAt TEXT NOT NULL,
    transcriptionStatus TEXT NOT NULL,
    transcriptionError TEXT,
    transcription TEXT,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    watchFolders TEXT NOT NULL DEFAULT '[]',
    whisperModel TEXT NOT NULL DEFAULT 'base',
    autoTranscribe INTEGER NOT NULL DEFAULT 0,
    language TEXT DEFAULT NULL,
    maxConcurrentTranscriptions INTEGER NOT NULL DEFAULT 2,
    useGPU INTEGER DEFAULT 1
  );
`);
// Insert default settings if not exists
const defaultSettings = db.prepare(`
  INSERT OR IGNORE INTO settings (id, watchFolders, whisperModel, autoTranscribe, maxConcurrentTranscriptions, useGPU)
  VALUES (1, '[]', 'base', 0, 2, 1)
`);
defaultSettings.run();
exports.default = db;
//# sourceMappingURL=index.js.map