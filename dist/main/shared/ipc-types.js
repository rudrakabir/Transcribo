"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpcChannels = void 0;
var IpcChannels;
(function (IpcChannels) {
    // File operations
    IpcChannels["SELECT_FILES"] = "select-files";
    IpcChannels["SELECT_DIRECTORY"] = "select-directory";
    IpcChannels["GET_FILE_LIST"] = "get-file-list";
    // Transcription
    IpcChannels["START_TRANSCRIPTION"] = "start-transcription";
    IpcChannels["CANCEL_TRANSCRIPTION"] = "cancel-transcription";
    IpcChannels["TRANSCRIPTION_PROGRESS"] = "transcription-progress";
    IpcChannels["TRANSCRIPTION_COMPLETE"] = "transcription-complete";
    IpcChannels["TRANSCRIPTION_ERROR"] = "transcription-error";
    // Settings
    IpcChannels["GET_SETTINGS"] = "get-settings";
    IpcChannels["UPDATE_SETTINGS"] = "update-settings";
})(IpcChannels || (exports.IpcChannels = IpcChannels = {}));
//# sourceMappingURL=ipc-types.js.map