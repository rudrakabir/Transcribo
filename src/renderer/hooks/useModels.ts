import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
const { ipcRenderer } = window.require('electron');

export function useModels() {
  const queryClient = useQueryClient();
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [activeDownloads, setActiveDownloads] = useState<string[]>([]);

  // Set up download progress listener
  useEffect(() => {
    const handleProgress = (_: any, { modelName, progress }: { modelName: string; progress: number }) => {
      setDownloadProgress(prev => ({
        ...prev,
        [modelName]: progress
      }));
    };

    ipcRenderer.on('modelDownloadProgress', handleProgress);

    return () => {
      ipcRenderer.removeListener('modelDownloadProgress', handleProgress);
    };
  }, []);

  // Get list of downloaded models
  const { data: downloadedModels = [], isLoading: isLoadingModels } = useQuery(
    ['downloadedModels'],
    () => ipcRenderer.invoke('listDownloadedModels'),
    {
      // Refresh every 5 seconds while there are active downloads
      refetchInterval: activeDownloads.length > 0 ? 5000 : false
    }
  );

  // Get model sizes
  const { data: modelSizes = {} } = useQuery(
    ['modelSizes'],
    async () => {
      const sizes: Record<string, number> = {};
      for (const model of [
        'tiny', 'tiny.en', 'base', 'base.en', 
        'small', 'small.en', 'medium', 'medium.en', 
        'large-v1', 'large'
      ]) {
        sizes[model] = await ipcRenderer.invoke('getModelSize', model);
      }
      return sizes;
    }
  );

  // Check download progress
  const getModelProgress = async (modelName: string): Promise<number> => {
    return ipcRenderer.invoke('getModelDownloadProgress', modelName);
  };

  // Check if a specific model is downloaded
  const checkModelDownloaded = async (modelName: string): Promise<boolean> => {
    return ipcRenderer.invoke('isModelDownloaded', modelName);
  };

  // Download model mutation
  const { mutate: downloadModel, isLoading: isDownloading } = useMutation(
    async (modelName: string) => {
      setActiveDownloads(prev => [...prev, modelName]);
      try {
        const result = await ipcRenderer.invoke('downloadModel', modelName);
        return result;
      } finally {
        setActiveDownloads(prev => prev.filter(m => m !== modelName));
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[modelName];
          return newProgress;
        });
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['downloadedModels']);
      }
    }
  );

  // Delete model mutation
  const { mutate: deleteModel } = useMutation(
    async (modelName: string) => {
      const result = await ipcRenderer.invoke('deleteModel', modelName);
      return result;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['downloadedModels']);
      }
    }
  );

  return {
    downloadedModels,
    isLoadingModels,
    isDownloading,
    checkModelDownloaded,
    modelSizes,
    downloadModel,
    deleteModel,
    downloadProgress,
    activeDownloads,
    getModelProgress
  };
}