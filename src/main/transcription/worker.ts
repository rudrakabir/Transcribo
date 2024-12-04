import { parentPort, workerData } from 'worker_threads';
import { transcribe } from './whisper';
import { TranscriptionJob } from '../../shared/types';

if (!parentPort) {
  throw new Error('This file must be run as a worker thread');
}

async function runTranscription(job: TranscriptionJob) {
  try {
    const { audioPath, modelName, language } = job;
    
    // Report start
    parentPort?.postMessage({ type: 'status', status: 'started' });

    // Initialize progress reporting
    const progressCallback = (progress: number) => {
      parentPort?.postMessage({ type: 'progress', progress });
    };

    // Run transcription
    const result = await transcribe(audioPath, {
      modelName,
      language,
      progressCallback,
    });

    // Report success
    parentPort?.postMessage({ type: 'completed', result });
  } catch (error) {
    // Report error
    parentPort?.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Handle incoming job
runTranscription(workerData as TranscriptionJob);