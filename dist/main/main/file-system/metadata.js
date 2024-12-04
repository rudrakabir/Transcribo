"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFileMetadata = generateFileMetadata;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
async function generateFileMetadata(filePath) {
    try {
        const stats = await fs_1.promises.stat(filePath);
        // Basic metadata that we can get from file stats
        return {
            size: stats.size,
            format: path_1.default.extname(filePath).slice(1),
            // Other fields will be populated when we actually read the audio file
            channels: undefined,
            sampleRate: undefined,
            bitrate: undefined,
            duration: undefined
        };
    }
    catch (error) {
        console.error('Error generating metadata:', error);
        throw error;
    }
}
//# sourceMappingURL=metadata.js.map