export interface AudioFile {
  id: string;
  path: string;
  fileName: string;
  size: number;
  duration?: number;
  createdAt: Date;
  modifiedAt: Date;
  transcriptionStatus: 'unprocessed' | 'pending' | 'processing' | 'completed' | 'error';
  transcriptionError?: string;
  transcription?: string;
  metadata: AudioMetadata;
  transcriptionMetadata?: TranscriptionMetadata;
}

export interface AudioMetadata {
  format: string;
  size: number;
  duration?: number;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  codec?: string;
}

export interface TranscriptionMetadata {
  progress?: number;
  timeElapsed?: number;
  error?: string;
}

export interface Settings {
  watchFolders: string[];
  whisperModel: string;
  autoTranscribe: boolean;
  language?: string;
  maxConcurrentTranscriptions: number;
  useGPU: boolean;
}

export interface TranscriptionOptions {
  model: string;
  language?: string;
  task?: 'transcribe' | 'translate';
  initialPrompt?: string;
  temperature?: number;
  wordTimestamps?: boolean;
  useGPU?: boolean;
}

export interface TranscriptionProgress {
  progress: number;
  timeElapsed: number;
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  confidence?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    probability: number;
  }>;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration?: number;
}

export interface ModelInfo {
  name: string;
  size: number;
  url: string;
  hash: string;
  downloaded: boolean;
  downloadProgress: number;
  downloadStatus: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
  altHashes?: string[];  // Added this
}

export interface FileData {
  buffer: ArrayBuffer;
}