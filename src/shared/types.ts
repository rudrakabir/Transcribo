export interface AudioMetadata {
  size: number;
  duration?: number;
  format?: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
}

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
  metadata?: AudioMetadata;
}

export interface Settings {
  watchFolders: string[];
  whisperModel: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  autoTranscribe: boolean;
  language?: string;
  maxConcurrentTranscriptions: number;
  useGPU: boolean;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}