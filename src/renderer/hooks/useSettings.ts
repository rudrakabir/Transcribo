import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings } from '../../shared/types';

export function useSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<Settings>(['settings'], async () => {
    return await window.electron.invoke('getSettings');
  });

  const updateMutation = useMutation(
    async (updates: Partial<Settings>) => {
      await window.electron.invoke('updateSettings', updates);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['settings']);
      },
    }
  );

  const updateSettings = async (updates: Partial<Settings>) => {
    await updateMutation.mutateAsync(updates);
  };

  const addWatchFolder = async () => {
    const folder = await window.electron.invoke('selectDirectory');
    if (folder && settings) {
      const updatedFolders = [...settings.watchFolders, folder];
      await updateSettings({ watchFolders: updatedFolders });
    }
  };

  const removeWatchFolder = async (folderPath: string) => {
    if (settings) {
      const updatedFolders = settings.watchFolders.filter(f => f !== folderPath);
      await updateSettings({ watchFolders: updatedFolders });
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
    addWatchFolder,
    removeWatchFolder,
    isUpdating: updateMutation.isLoading,
  };
}