"use strict";
// ... (imports and beginning of the file remain the same)
async;
transcribe(audioPath, string, options, TranscriptionOptions & { onProgress: (progress) => void  });
Promise < TranscriptionResult > {
    : .whisper
};
{
    throw new Error('Whisper context not initialized');
}
try {
    const result = await this.whisper.transcribe(audioData, {
        ...options,
        onProgress: options.onProgress
    });
    return result;
}
catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown transcription error';
    throw new Error(`Transcription failed: ${errorMessage}`);
}
// ... (rest of the file remains the same)
//# sourceMappingURL=whisper.js.map