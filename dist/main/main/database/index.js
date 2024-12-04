"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initializeDatabase = initializeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'transcribo.db');
const schemaPath = path_1.default.join(__dirname, 'schema.sql');
function initializeDatabase() {
    const db = new better_sqlite3_1.default(dbPath);
    // Read and execute schema
    const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    // Insert default settings if not exists
    const hasSettings = db.prepare('SELECT id FROM settings WHERE id = 1').get();
    if (!hasSettings) {
        db.prepare(`
      INSERT INTO settings (id, watchFolders, whisperModel, autoTranscribe, maxConcurrentTranscriptions, useGPU)
      VALUES (1, '[]', 'base', 0, 2, 1)
    `).run();
    }
    return db;
}
exports.db = initializeDatabase();
