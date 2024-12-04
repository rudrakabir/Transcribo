import { useState, useEffect } from 'react';
import { AudioFile, TranscriptionSegment } from '../../shared/types';
const { ipcRenderer } = window.require('electron');

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
    // Listen for transcription progress updates
    const progressHandler = (_: any, fileId: string, currentProgress: number) => {
      if (activeFile?.id === fileId) {
        setProgress(currentProgress);
      }
    };

    // Listen for transcription completion
    const completionHandler = async (_: any, fileId: string, result: Transcription) => {
      if (activeFile?.id === fileId) {
        setTranscription(result);
        setIsTranscribing(false);
        setProgress(100);
        
        // Update file status
        const updatedFile = await ipcRenderer.invoke('getAudioFile', fileId);
        setActiveFile(updatedFile);
      }
    };

    // Listen for transcription errors
    const errorHandler = (_: any, fileId: string, error: string) => {
      if (activeFile?.id === fileId) {
        setIsTranscribing(false);
        setProgress(0);
      }
    };

    ipcRenderer.on('transcriptionProgress', progressHandler);
    ipcRenderer.on('transcriptionComplete', completionHandler);
    ipcRenderer.on('transcriptionError', errorHandler);

    return () => {
      ipcRenderer.removeListener('transcriptionProgress', progressHandler);
      ipcRenderer.removeListener('transcriptionComplete', completionHandler);
      ipcRenderer.removeListener('transcriptionError', errorHandler);
    };
  }, [activeFile]);

  const startTranscription = async (fileId: string) => {
    try {
      setIsTranscribing(true);
      setProgress(0);
      await ipcRenderer.invoke('startTranscription', fileId);
    } catch (error) {
      setIsTranscribing(false);
      throw error;
    }
  };

  const cancelTranscription = async () => {
    if (activeFile) {
      await ipcRenderer.invoke('cancelTranscription', activeFile.id);
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

    await ipcRenderer.invoke('updateTranscription', activeFile.id, updatedTranscription);
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