CREATE TABLE IF NOT EXISTS audio_files (
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

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  watchFolders TEXT NOT NULL,
  whisperModel TEXT NOT NULL,
  autoTranscribe INTEGER NOT NULL,
  language TEXT,
  maxConcurrentTranscriptions INTEGER NOT NULL DEFAULT 2,
  useGPU INTEGER DEFAULT 1
);