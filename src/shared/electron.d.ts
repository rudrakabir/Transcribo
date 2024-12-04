export interface IpcApi {
  invoke(channel: 'get-available-models'): Promise<string[]>;
  invoke(channel: 'is-model-downloaded', modelName: string): Promise<boolean>;
  invoke(channel: 'get-model-info', modelName: string): Promise<{
    url: string;
    size: number;
    hash: string;
  } | null>;
  invoke(channel: 'download-model', modelName: string): Promise<{
    success: boolean;
    error?: string;
  }>;
  invoke(channel: 'cancel-model-download', modelName: string): Promise<void>;
  
  on(channel: 'model-download-progress', callback: (data: {
    modelName: string;
    progress: number;
  }) => void): void;
  
  removeAllListeners(channel: string): void;
}

declare global {
  interface Window {
    electron: IpcApi;
  }
}