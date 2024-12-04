"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFile = processFile;
exports.cancelProcessing = cancelProcessing;
const whisper_1 = require("./whisper");
const whisperService = new whisper_1.WhisperService();
// Worker logic will be implemented here
async function processFile(filePath) {
    // Implementation pending
    console.log('Processing file:', filePath);
}
async function cancelProcessing() {
    // Implementation pending
    console.log('Cancelling processing');
}
//# sourceMappingURL=worker.js.map