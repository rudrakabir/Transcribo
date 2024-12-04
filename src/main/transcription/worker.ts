import { WhisperService } from './whisper';

const whisperService = new WhisperService();

// Worker logic will be implemented here
export async function processFile(filePath: string): Promise<void> {
  // Implementation pending
  console.log('Processing file:', filePath);
}

export async function cancelProcessing(): Promise<void> {
  // Implementation pending
  console.log('Cancelling processing');
}