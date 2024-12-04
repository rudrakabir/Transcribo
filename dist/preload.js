"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electron', {
    invoke: (channel, ...args) => {
        return electron_1.ipcRenderer.invoke(channel, ...args);
    },
    on: (channel, func) => {
        const subscription = (_event, ...args) => func(...args);
        electron_1.ipcRenderer.on(channel, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(channel, subscription);
        };
    },
    removeListener: (channel, func) => {
        electron_1.ipcRenderer.removeListener(channel, func);
    },
    removeAllListeners: (channel) => {
        electron_1.ipcRenderer.removeAllListeners(channel);
    }
});
//# sourceMappingURL=preload.js.map