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

// ... (rest of the types remain the same)