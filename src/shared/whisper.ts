export interface WhisperSegment {
    id: number;
    start: number;
    end: number;
    text: string;
    confidence: number;
}

export interface TranscriptionResult {
    text: string;
    segments: WhisperSegment[];
    language: string;
    duration: number;
    modelType: string;
}

export interface TranscriptionOptions {
    language?: string;
    translate?: boolean;
    useGPU?: boolean;
    threads?: number;
    speedUp?: boolean;
    initialPrompt?: string;
    onProgress?: (progress: number) => void;
}

export interface WhisperContext {
    loadModel(modelPath: string): Promise<boolean>;
    transcribe(audioData: Float32Array, options: TranscriptionOptions): Promise<TranscriptionResult>;
    release(): void;
    getInfo(): {
        model_path: string;
        is_multilingual: boolean;
    };
}

declare global {
    namespace NodeJS {
        interface Global {
            WhisperContext: {
                new(): WhisperContext;
            }
        }
    }
}

export const createWhisperContext = (): WhisperContext => {
    if (typeof global.WhisperContext === 'undefined') {
        throw new Error('Whisper native module not loaded');
    }
    return new global.WhisperContext();
};