import { IpcChannels } from '../../constants';
import { Settings } from '../../shared/types';

const { ipcRenderer } = window.require('electron');

export const useIpc = () => {
  return {
    selectFiles: () => ipcRenderer.invoke(IpcChannels.SELECT_FILES),
    selectDirectory: () => ipcRenderer.invoke(IpcChannels.SELECT_DIRECTORY),
    getFiles: () => ipcRenderer.invoke(IpcChannels.GET_FILE_LIST),
    getSettings: () => ipcRenderer.invoke(IpcChannels.GET_SETTINGS),
    updateSettings: (settings: Settings) => ipcRenderer.invoke(IpcChannels.UPDATE_SETTINGS, settings)
  };
};