"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIpcHandlers = setupIpcHandlers;
const settings_handlers_1 = require("./settings-handlers");
const file_handlers_1 = require("./file-handlers");
const transcription_handlers_1 = require("./transcription-handlers");
const model_handlers_1 = require("./model-handlers");
async function setupIpcHandlers() {
    // Set up all handlers
    (0, settings_handlers_1.setupSettingsHandlers)();
    (0, file_handlers_1.setupFileHandlers)();
    (0, transcription_handlers_1.setupTranscriptionHandlers)();
    (0, model_handlers_1.setupModelHandlers)();
    // Log registered handlers for debugging
    console.log('IPC Handlers initialized successfully');
}
//# sourceMappingURL=handlers.js.map