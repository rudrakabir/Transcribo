export interface AudioFile {
  id: string;
  path: string;
  fileName: string;
  size: number;
  duration?: number;
  createdAt: Date;
  modifiedAt: Date;
  transcriptionStatus: 'unprocessed' | 'pending' | 'processing' | 'completed' | 'error';
  transcriptionError?: string | null;  // Updated to allow null
  transcription?: string;
  metadata?: AudioMetadata;
}

export interface AudioMetadata {
  format?: string;
  channels?: number;
  sampleRate?: number;
  bitrate?: number;
  duration?: number;
  size: number;  // Added size
}

export interface Settings {
  watchFolders: string[];
  whisperModel: 'tiny' | 'tiny.en' | 'base' | 'base.en' | 'small' | 'small.en' | 'medium' | 'medium.en' | 'large-v1' | 'large';
  autoTranscribe: boolean;
  language?: string;
  maxConcurrentTranscriptions: number;
  useGPU: boolean;
  outputFormat: 'text' | 'srt' | 'vtt';
}

export interface TranscriptionJob {
  fileId: string;
  audioPath: string;
  modelName: Settings['whisperModel'];
  language?: string;
  outputFormat?: 'text' | 'srt' | 'vtt';
}

export interface TranscriptionProgress {
  fileId: string;
  progress: number;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  words?: Array<{
    start: number;
    end: number;
    word: string;
  }>;
}