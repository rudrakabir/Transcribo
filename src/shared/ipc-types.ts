export enum IpcChannels {
  // File operations
  SELECT_FILES = 'select-files',
  SELECT_DIRECTORY = 'select-directory',
  GET_FILE_LIST = 'get-file-list',
  
  // Transcription
  START_TRANSCRIPTION = 'start-transcription',
  CANCEL_TRANSCRIPTION = 'cancel-transcription',
  TRANSCRIPTION_PROGRESS = 'transcription-progress',
  TRANSCRIPTION_COMPLETE = 'transcription-complete',
  TRANSCRIPTION_ERROR = 'transcription-error',
  
  // Settings
  GET_SETTINGS = 'get-settings',
  UPDATE_SETTINGS = 'update-settings'
}