import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { DownloadIcon, CheckIcon } from '@chakra-ui/icons';

interface ModelInfo {
  url: string;
  size: number;
  hash: string;
}

interface ModelDownloadProgress {
  [modelName: string]: number;
}

export const ModelManager: React.FC = () => {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<ModelDownloadProgress>({});
  const [modelInfo, setModelInfo] = useState<{ [key: string]: ModelInfo }>({});
  const toast = useToast();

  useEffect(() => {
    // Load initial model states
    refreshModelStates();

    // Listen for download progress updates
    window.electron.on('model-download-progress', ({ modelName, progress }) => {
      setDownloadProgress(prev => ({
        ...prev,
        [modelName]: progress
      }));
    });

    return () => {
      // Cleanup listeners
      window.electron.removeAllListeners('model-download-progress');
    };
  }, []);

  const refreshModelStates = async () => {
    try {
      const models = await window.electron.invoke('get-available-models');
      setAvailableModels(models);

      // Get info for all models
      const modelNames = ['tiny', 'base', 'small', 'medium', 'large-v3'];
      const infoPromises = modelNames.map(async name => {
        const info = await window.electron.invoke('get-model-info', name);
        return [name, info];
      });

      const infos = await Promise.all(infoPromises);
      setModelInfo(Object.fromEntries(infos));
    } catch (error) {
      console.error('Failed to refresh model states:', error);
    }
  };

  const downloadModel = async (modelName: string) => {
    try {
      const result = await window.electron.invoke('download-model', modelName);
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: 'Download Complete',
        description: `Successfully downloaded ${modelName} model`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh available models
      await refreshModelStates();
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`;
    }
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Whisper Models</Heading>
      </CardHeader>
      <CardBody>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {['tiny', 'base', 'small', 'medium', 'large-v3'].map((modelName) => {
            const isDownloaded = availableModels.includes(modelName);
            const progress = downloadProgress[modelName] || 0;
            const info = modelInfo[modelName];
            const isDownloading = progress > 0 && progress < 100;

            return (
              <Card key={modelName} variant="outline">
                <CardBody>
                  <Stack spacing={3}>
                    <Heading size="sm" textTransform="capitalize">
                      {modelName}
                    </Heading>
                    
                    {info && (
                      <Text fontSize="sm" color="gray.600">
                        Size: {formatSize(info.size)}
                      </Text>
                    )}

                    {isDownloading && (
                      <Box>
                        <Progress 
                          value={progress} 
                          size="sm" 
                          colorScheme="blue" 
                          mb={2}
                        />
                        <Text fontSize="sm" color="gray.600">
                          {progress.toFixed(1)}% Complete
                        </Text>
                      </Box>
                    )}

                    {!isDownloading && (
                      <Button
                        leftIcon={isDownloaded ? <CheckIcon /> : <DownloadIcon />}
                        colorScheme={isDownloaded ? "green" : "blue"}
                        onClick={() => !isDownloaded && downloadModel(modelName)}
                        isDisabled={isDownloaded}
                      >
                        {isDownloaded ? 'Downloaded' : 'Download'}
                      </Button>
                    )}
                  </Stack>
                </CardBody>
              </Card>
            );
          })}
        </SimpleGrid>
      </CardBody>
    </Card>
  );
};

export default ModelManager;