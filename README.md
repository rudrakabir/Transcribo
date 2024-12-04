# Transcribo

A powerful desktop application for transcribing audio files using Whisper AI. Built with Electron, React, and TypeScript.

## Features

- 🎯 Accurate transcription using Whisper AI
- 📂 Batch processing of multiple audio files
- 🌍 Multiple language support
- ⚡ GPU acceleration support
- 🔄 Concurrent processing
- 📊 Real-time progress tracking
- 🎛️ Advanced settings and configuration
- 📁 Watch folder support for automatic transcription

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/transcribo.git
cd transcribo
```

2. Install dependencies:
```bash
npm install
```

3. Build the native modules:
```bash
npm run build:native
```

4. Start the application:
```bash
npm start
```

## Development

### Project Structure

```
src/
├── main/                 # Electron main process
│   ├── database/        # SQLite database management
│   ├── file-system/     # File operations
│   ├── ipc/            # Inter-process communication
│   └── transcription/   # Whisper integration
├── renderer/            # React frontend
│   ├── components/      # React components
│   └── hooks/          # Custom React hooks
└── shared/             # Shared types and utilities
```

### Technical Architecture

#### 1. Core Components

**Database Layer**
- Uses SQLite through better-sqlite3
- Schema:
  ```sql
  CREATE TABLE audio_files (
    id TEXT PRIMARY KEY,
    path TEXT UNIQUE NOT NULL,
    fileName TEXT NOT NULL,
    size INTEGER NOT NULL,
    duration INTEGER,
    createdAt TEXT NOT NULL,
    modifiedAt TEXT NOT NULL,
    transcriptionStatus TEXT NOT NULL,
    transcriptionError TEXT,
    transcription TEXT,
    metadata TEXT
  );

  CREATE TABLE settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    watchFolders TEXT NOT NULL,
    whisperModel TEXT NOT NULL,
    autoTranscribe INTEGER NOT NULL,
    language TEXT,
    maxConcurrentTranscriptions INTEGER NOT NULL DEFAULT 2,
    useGPU INTEGER DEFAULT 1
  );
  ```

**Whisper Integration**
- Native bindings with whisper.cpp
- Features:
  - Multi-threaded processing
  - Real-time progress tracking
  - Multiple model support
  - Language detection
  - Translation capability

**File Management**
- Audio format support:
  - MP3, WAV, M4A, FLAC, OGG
- Watch folder functionality
- Automatic metadata extraction
- Batch processing

#### 2. Process Flow

1. **File Input**
   ```typescript
   // Select files or monitor folders
   watchFolder(path: string): void
   processAudioFile(file: File): Promise<AudioMetadata>
   ```

2. **Preprocessing**
   ```typescript
   // Convert audio to required format
   class AudioProcessor {
     async preprocessAudio(filePath: string): Promise<Float32Array>
     async getMetadata(filePath: string): Promise<AudioMetadata>
   }
   ```

3. **Transcription**
   ```typescript
   // Queue and process files
   class TranscriptionQueue {
     addToQueue(item: QueueItem): void
     processQueue(): Promise<void>
     cancelTranscription(id: string): void
   }
   ```

4. **Output Handling**
   ```typescript
   // Save and format results
   saveTranscription(id: string, result: TranscriptionResult): Promise<void>
   exportSubtitles(id: string, format: 'srt' | 'vtt'): Promise<string>
   ```

### Building and Development

#### Prerequisites
- Node.js 16+
- Python 3.7+
- C++ build tools
  - Windows: Visual Studio Build Tools
  - macOS: Xcode Command Line Tools
  - Linux: GCC and associated build tools
- CMake 3.x+

#### Build Commands
```bash
# Build native modules
npm run build:native

# Build frontend
npm run build:renderer

# Build main process
npm run build:main

# Build everything
npm run build

# Development with hot reload
npm run dev
```

### API Reference

#### 1. Whisper Integration

```typescript
interface WhisperOptions {
  language?: string;
  translate?: boolean;
  useGPU?: boolean;
  threads?: number;
  onProgress?: (progress: number) => void;
}

interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
}

class WhisperWrapper {
  constructor();
  loadModel(modelPath: string): boolean;
  async transcribe(audioData: Float32Array, options: WhisperOptions): Promise<TranscriptionResult>;
  release(): void;
}
```

#### 2. Model Management

```typescript
interface ModelInfo {
  name: string;
  size: number;
  url: string;
  hash: string;
  downloaded?: boolean;
}

class ModelManager {
  async isModelDownloaded(modelName: string): Promise<boolean>;
  async getModelInfo(modelName: string): Promise<ModelInfo>;
  async downloadModel(modelName: string, progressCallback?: (progress: number) => void): Promise<void>;
  getAvailableModels(): Record<string, ModelInfo>;
}
```

#### 3. Queue Management

```typescript
interface QueueItem {
  id: string;
  audioPath: string;
  options: TranscriptionOptions;
}

class TranscriptionQueue {
  addToQueue(item: QueueItem): void;
  cancelTranscription(id: string): void;
  getQueueLength(): number;
  getProcessingCount(): number;
  setMaxConcurrent(max: number): void;
}
```

### IPC Commands

```typescript
// Main to Renderer
'transcription-progress': (progress: TranscriptionProgress) => void
'transcription-complete': (result: TranscriptionResult) => void
'transcription-error': (error: string) => void
'model-download-progress': (progress: number) => void

// Renderer to Main
'start-transcription': (path: string, options?: TranscriptionOptions) => Promise<string>
'cancel-transcription': (id: string) => Promise<boolean>
'download-model': (modelName: string) => Promise<void>
'get-model-info': (modelName: string) => Promise<ModelInfo>
```

### Error Handling

The application implements comprehensive error handling:

1. **File System Errors**
   ```typescript
   try {
     await fs.access(filePath);
   } catch (error: unknown) {
     if (error instanceof Error) {
       console.error(`File access error: ${error.message}`);
     }
     throw new Error('File not accessible');
   }
   ```

2. **Transcription Errors**
   ```typescript
   class TranscriptionError extends Error {
     constructor(
       message: string,
       public readonly code: string,
       public readonly recoverable: boolean
     ) {
       super(message);
     }
   }
   ```

3. **Database Errors**
   ```typescript
   function withTransaction<T>(operation: () => T): T {
     try {
       db.prepare('BEGIN').run();
       const result = operation();
       db.prepare('COMMIT').run();
       return result;
     } catch (error) {
       db.prepare('ROLLBACK').run();
       throw error;
     }
   }
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

1. **Code Style**
   - Use TypeScript strict mode
   - Follow ESLint configuration
   - Use Prettier for formatting
   - Write meaningful commit messages

2. **Testing**
   - Write unit tests for new features
   - Ensure all tests pass before submitting PR
   - Include integration tests for complex features

3. **Documentation**
   - Update README.md for new features
   - Include JSDoc comments for public APIs
   - Document any configuration changes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Whisper](https://github.com/openai/whisper) by OpenAI
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) for the efficient C++ implementation
- [Electron](https://www.electronjs.org/) for the desktop framework
- [React](https://reactjs.org/) for the UI framework