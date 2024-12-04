import { useState, useCallback } from 'react';
import { AudioFile } from '../../shared/types';

export function useFileSelection() {
  const [files, setFiles] = useState<AudioFile[]>([]);

  const selectFiles = useCallback(async () => {
    const newFiles = await window.electron.invoke('selectFiles');
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const selectDirectory = useCallback(async () => {
    const dirPath = await window.electron.invoke('selectDirectory');
    if (dirPath) {
      const newFiles = await window.electron.invoke('getAudioFiles');
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const deleteFile = useCallback(async (id: string) => {
    await window.electron.invoke('deleteAudioFile', id);
    setFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const retryTranscription = useCallback(async (id: string) => {
    await window.electron.invoke('updateAudioFile', id, { transcriptionStatus: 'pending' });
    setFiles(prev => prev.map(file => 
      file.id === id 
        ? { ...file, transcriptionStatus: 'pending' as const } 
        : file
    ));
  }, []);

  return { files, selectFiles, selectDirectory, deleteFile, retryTranscription };
}