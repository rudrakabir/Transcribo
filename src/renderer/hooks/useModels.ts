import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
const { ipcRenderer } = window.require('electron');

export function useModels() {
  const queryClient = useQueryClient();

  // Get list of downloaded models
  const { data: downloadedModels = [], isLoading: isLoadingModels } = useQuery(
    ['downloadedModels'],
    () => ipcRenderer.invoke('listDownloadedModels')
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

  // Check if a specific model is downloaded
  const checkModelDownloaded = async (modelName: string) => {
    return ipcRenderer.invoke('isModelDownloaded', modelName);
  };

  // Download model mutation
  const { mutate: downloadModel, isLoading: isDownloading } = useMutation(
    (modelName: string) => ipcRenderer.invoke('downloadModel', modelName),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['downloadedModels']);
      }
    }
  );

  // Delete model mutation
  const { mutate: deleteModel } = useMutation(
    (modelName: string) => ipcRenderer.invoke('deleteModel', modelName),
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
    deleteModel
  };
}