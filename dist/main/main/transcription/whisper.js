"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhisperService = void 0;
const path_1 = __importDefault(require("path"));
// Placeholder for whisper.cpp integration
class WhisperService {
    constructor() {
        this.modelsDir = path_1.default.join(process.cwd(), 'native', 'whisper', 'models');
    }
}
exports.WhisperService = WhisperService;
//# sourceMappingURL=whisper.js.map