import { useState, useEffect } from 'react';
import { AudioFile, TranscriptionSegment } from '../../shared/types';

interface Transcription {
  segments: TranscriptionSegment[];
  text: string;
  language: string;
}

export function useTranscription() {
  const [activeFile, setActiveFile] = useState<AudioFile | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [progress, setProgress] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    if (!activeFile) return;

    // Listen for transcription progress updates
    const progressHandler = (fileId: string, currentProgress: number) => {
      if (activeFile.id === fileId) {
        setProgress(currentProgress);
      }
    };

    // Listen for transcription completion
    const completionHandler = async (fileId: string, result: Transcription) => {
      if (activeFile.id === fileId) {
        setTranscription(result);
        setIsTranscribing(false);
        setProgress(100);
        
        // Update file status
        const updatedFile = await window.electron.invoke('getAudioFile', fileId);
        setActiveFile(updatedFile);
      }
    };

    // Listen for transcription errors
    const errorHandler = (fileId: string, error: string) => {
      if (activeFile.id === fileId) {
        setIsTranscribing(false);
        setProgress(0);
      }
    };

    // Set up listeners
    const removeProgressListener = window.electron.on('transcriptionProgress', progressHandler);
    const removeCompletionListener = window.electron.on('transcriptionComplete', completionHandler);
    const removeErrorListener = window.electron.on('transcriptionError', errorHandler);

    // Cleanup listeners
    return () => {
      removeProgressListener();
      removeCompletionListener();
      removeErrorListener();
    };
  }, [activeFile]);

  const startTranscription = async (fileId: string) => {
    try {
      setIsTranscribing(true);
      setProgress(0);
      await window.electron.invoke('startTranscription', fileId);
    } catch (error) {
      setIsTranscribing(false);
      throw error;
    }
  };

  const cancelTranscription = async () => {
    if (activeFile) {
      await window.electron.invoke('cancelTranscription', activeFile.id);
      setIsTranscribing(false);
      setProgress(0);
    }
  };

  const updateSegmentText = async (index: number, newText: string) => {
    if (!activeFile || !transcription) return;

    const updatedSegments = [...transcription.segments];
    updatedSegments[index] = {
      ...updatedSegments[index],
      text: newText
    };

    const updatedTranscription = {
      ...transcription,
      segments: updatedSegments,
      text: updatedSegments.map(s => s.text).join(' ')
    };

    await window.electron.invoke('updateTranscription', activeFile.id, updatedTranscription);
    setTranscription(updatedTranscription);
  };

  return {
    activeFile,
    transcription,
    progress,
    isTranscribing,
    startTranscription,
    cancelTranscription,
    updateSegmentText,
    setActiveFile
  };
}