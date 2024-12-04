import path from 'path';
import { exec } from 'child_process';

// Placeholder for whisper.cpp integration
export class WhisperService {
  private modelsDir: string;

  constructor() {
    this.modelsDir = path.join(process.cwd(), 'native', 'whisper', 'models');
  }
}
