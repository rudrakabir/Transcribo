"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAudioFile = addAudioFile;
exports.addAudioDirectory = addAudioDirectory;
exports.getAudioFiles = getAudioFiles;
exports.updateTranscriptionStatus = updateTranscriptionStatus;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const database_1 = require("../database");
const SUPPORTED_FORMATS = ['.mp3', '.wav', '.ogg', '.m4a'];
async function addAudioFile(filePath) {
    try {
        const stats = await fs_1.promises.stat(filePath);
        const fileExt = path_1.default.extname(filePath).toLowerCase();
        if (!SUPPORTED_FORMATS.includes(fileExt)) {
            throw new Error('Unsupported file format');
        }
        const recording = {
            id: (0, uuid_1.v4)(),
            path: filePath,
            fileName: path_1.default.basename(filePath),
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            transcriptionStatus: 'unprocessed'
        };
        database_1.db.prepare(`
      INSERT INTO audio_files (
        id, path, fileName, size, createdAt, modifiedAt, transcriptionStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(recording.id, recording.path, recording.fileName, recording.size, recording.createdAt.toISOString(), recording.modifiedAt.toISOString(), recording.transcriptionStatus);
        return recording;
    }
    catch (error) {
        console.error('Error adding audio file:', error);
        return null;
    }
}
async function addAudioDirectory(dirPath) {
    const recordings = [];
    try {
        const files = await fs_1.promises.readdir(dirPath);
        for (const file of files) {
            const filePath = path_1.default.join(dirPath, file);
            const fileExt = path_1.default.extname(file).toLowerCase();
            if (SUPPORTED_FORMATS.includes(fileExt)) {
                const recording = await addAudioFile(filePath);
                if (recording)
                    recordings.push(recording);
            }
        }
    }
    catch (error) {
        console.error('Error processing directory:', error);
    }
    return recordings;
}
function getAudioFiles() {
    const stmt = database_1.db.prepare('SELECT * FROM audio_files ORDER BY createdAt DESC');
    const rows = stmt.all();
    return rows.map(row => ({
        id: row.id,
        path: row.path,
        fileName: row.fileName,
        size: row.size,
        createdAt: new Date(row.createdAt),
        modifiedAt: new Date(row.modifiedAt),
        transcriptionStatus: row.transcriptionStatus,
        transcriptionError: row.transcriptionError || undefined,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
}
function updateTranscriptionStatus(id, status, error) {
    const stmt = database_1.db.prepare(`
    UPDATE audio_files 
    SET transcriptionStatus = ?, transcriptionError = ?
    WHERE id = ?
  `);
    return stmt.run(status, error || null, id);
}
