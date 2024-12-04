"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAudioFile = exports.updateAudioFile = exports.getAudioFiles = exports.addAudioFile = exports.updateSettings = exports.getSettings = void 0;
const index_1 = __importDefault(require("./index"));
const getSettings = () => {
    const result = index_1.default.prepare('SELECT * FROM settings WHERE id = 1').get();
    return {
        ...result,
        watchFolders: JSON.parse(result.watchFolders),
        autoTranscribe: Boolean(result.autoTranscribe),
        useGPU: Boolean(result.useGPU)
    };
};
exports.getSettings = getSettings;
const updateSettings = (settings) => {
    const updates = Object.entries(settings)
        .map(([key, value]) => {
        if (key === 'watchFolders')
            return `${key} = '${JSON.stringify(value)}'`;
        if (typeof value === 'boolean')
            return `${key} = ${value ? 1 : 0}`;
        return `${key} = '${value}'`;
    })
        .join(', ');
    index_1.default.prepare(`UPDATE settings SET ${updates} WHERE id = 1`).run();
};
exports.updateSettings = updateSettings;
const addAudioFile = (file) => {
    const dbFile = {
        ...file,
        metadata: JSON.stringify(file.metadata || {}),
        createdAt: file.createdAt.toISOString(),
        modifiedAt: file.modifiedAt.toISOString()
    };
    const stmt = index_1.default.prepare(`
    INSERT INTO audio_files (id, path, fileName, size, duration, createdAt, modifiedAt, transcriptionStatus, metadata)
    VALUES (@id, @path, @fileName, @size, @duration, @createdAt, @modifiedAt, @transcriptionStatus, @metadata)
  `);
    stmt.run(dbFile);
};
exports.addAudioFile = addAudioFile;
const getAudioFiles = () => {
    const files = index_1.default.prepare('SELECT * FROM audio_files').all();
    return files.map(file => ({
        ...file,
        metadata: JSON.parse(file.metadata || '{}'),
        createdAt: new Date(file.createdAt),
        modifiedAt: new Date(file.modifiedAt)
    }));
};
exports.getAudioFiles = getAudioFiles;
const updateAudioFile = (id, updates) => {
    const validUpdates = Object.entries(updates)
        .filter(([key]) => key !== 'id')
        .map(([key, value]) => {
        if (key === 'metadata')
            return `${key} = '${JSON.stringify(value)}'`;
        if (value instanceof Date)
            return `${key} = '${value.toISOString()}'`;
        return `${key} = '${value}'`;
    })
        .join(', ');
    index_1.default.prepare(`UPDATE audio_files SET ${validUpdates} WHERE id = ?`).run(id);
};
exports.updateAudioFile = updateAudioFile;
const deleteAudioFile = (id) => {
    index_1.default.prepare('DELETE FROM audio_files WHERE id = ?').run(id);
};
exports.deleteAudioFile = deleteAudioFile;
//# sourceMappingURL=queries.js.map