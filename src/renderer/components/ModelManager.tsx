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
import { ModelInfo } from '../../shared/types';

interface ModelDownloadProgress {
  [modelName: string]: number;
}

export const ModelManager: React.FC = () => {
  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<ModelDownloadProgress>({});
  const [modelInfo, setModelInfo] = useState<{ [key: string]: ModelInfo }>({});
  const toast = useToast();

  useEffect(() => {
    refreshModelStates();

    window.electron.on('model-download-progress', ({ modelName, progress }) => {
      setDownloadProgress(prev => ({
        ...prev,
        [modelName]: progress
      }));
    });

    return () => {
      window.electron.removeAllListeners('model-download-progress');
    };
  }, []);

  const refreshModelStates = async () => {
    try {
      const downloaded = await window.electron.invoke('list-models');
      setDownloadedModels(downloaded);

      const models = await window.electron.invoke('get-available-models');
      const modelNames = Object.keys(models);

      const infoPromises = modelNames.map(async name => {
        try {
          const info = await window.electron.invoke('get-model-info', name);
          return [name, info];
        } catch (error) {
          console.error(`Failed to get info for model ${name}:`, error);
          return null;
        }
      });

      const infos = (await Promise.all(infoPromises))
        .filter((info): info is [string, ModelInfo] => info !== null);
      setModelInfo(Object.fromEntries(infos));
    } catch (error) {
      console.error('Failed to refresh model states:', error);
      toast({
        title: 'Error',
        description: 'Failed to load model information',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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

  const getModelDescription = (modelName: string): string => {
    const descriptions: Record<string, string> = {
      tiny: 'Fast transcription, good for simple audio',
      base: 'Balanced speed and accuracy',
      small: 'Better accuracy, moderate processing time',
      medium: 'Best accuracy, longer processing time'
    };
    return descriptions[modelName] || '';
  };

  return (
    <Box p={4} bg="white" borderRadius="md" shadow="sm">
      <Heading size="md" mb={6}>Available Whisper Models</Heading>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {Object.keys(modelInfo).map((modelName) => {
          const isDownloaded = downloadedModels.includes(modelName);
          const progress = downloadProgress[modelName] || 0;
          const info = modelInfo[modelName];
          const isDownloading = progress > 0 && progress < 100;

          return (
            <Card 
              key={modelName} 
              variant="outline" 
              bg="gray.50" 
              borderColor="gray.200"
              transition="all 0.2s"
              _hover={{ shadow: 'md' }}
            >
              <CardBody>
                <Stack spacing={4}>
                  <Box>
                    <Text
                      fontSize="lg"
                      fontWeight="semibold"
                      textTransform="capitalize"
                      color="blue.600"
                    >
                      {modelName}
                    </Text>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      {getModelDescription(modelName)}
                    </Text>
                  </Box>

                  {info && (
                    <Text fontSize="sm" color="gray.500">
                      Size: {formatSize(info.size)}
                    </Text>
                  )}

                  {isDownloading ? (
                    <Box>
                      <Progress 
                        value={progress} 
                        size="sm" 
                        colorScheme="blue" 
                        rounded="full"
                        mb={2}
                      />
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        {progress.toFixed(1)}% Complete
                      </Text>
                    </Box>
                  ) : (
                    <Button
                      leftIcon={isDownloaded ? <CheckIcon /> : <DownloadIcon />}
                      colorScheme={isDownloaded ? "green" : "blue"}
                      onClick={() => !isDownloaded && downloadModel(modelName)}
                      isDisabled={isDownloaded}
                      size="md"
                      width="full"
                      variant={isDownloaded ? "solid" : "solid"}
                      _hover={!isDownloaded ? { transform: 'translateY(-1px)' } : {}}
                      transition="all 0.2s"
                    >
                      {isDownloaded ? 'Downloaded' : 'Download Model'}
                    </Button>
                  )}
                </Stack>
              </CardBody>
            </Card>
          );
        })}
      </SimpleGrid>
    </Box>
  );
};

export default ModelManager;