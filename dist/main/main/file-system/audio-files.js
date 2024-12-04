"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanDirectory = scanDirectory;
const path_1 = __importDefault(require("path"));
const promises_1 = require("fs/promises");
const uuid_1 = require("uuid");
const metadata_1 = require("./metadata");
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac']);
async function scanDirectory(dirPath) {
    const files = await (0, promises_1.readdir)(dirPath);
    const audioFiles = [];
    for (const file of files) {
        const filePath = path_1.default.join(dirPath, file);
        const fileExt = path_1.default.extname(file).toLowerCase();
        if (AUDIO_EXTENSIONS.has(fileExt)) {
            const metadata = await (0, metadata_1.generateFileMetadata)(filePath);
            const stats = await (0, promises_1.stat)(filePath);
            const audioFile = {
                id: (0, uuid_1.v4)(),
                path: filePath,
                fileName: file,
                size: stats.size,
                duration: metadata.duration,
                createdAt: new Date(),
                modifiedAt: new Date(),
                transcriptionStatus: 'unprocessed',
                metadata
            };
            audioFiles.push(audioFile);
        }
    }
    return audioFiles;
}
//# sourceMappingURL=audio-files.js.map