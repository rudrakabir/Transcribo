import React from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { DeleteIcon, DownloadIcon } from '@chakra-ui/icons';
import { useModels } from '../hooks/useModels';
import { useSettings } from '../hooks/useSettings';

const AVAILABLE_MODELS = [
  'tiny',
  'tiny.en',
  'base',
  'base.en',
  'small',
  'small.en',
  'medium',
  'medium.en',
  'large-v1',
  'large'
] as const;

export const ModelManager: React.FC = () => {
  const toast = useToast();
  const { settings } = useSettings();
  const {
    downloadedModels,
    isLoadingModels,
    isDownloading,
    modelSizes,
    downloadModel,
    deleteModel
  } = useModels();

  const handleDownload = async (modelName: string) => {
    try {
      await downloadModel(modelName);
      toast({
        title: 'Model downloaded',
        description: `Successfully downloaded ${modelName} model`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (modelName: string) => {
    if (modelName === settings?.whisperModel) {
      toast({
        title: 'Cannot delete model',
        description: 'This model is currently selected in settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      await deleteModel(modelName);
      toast({
        title: 'Model deleted',
        description: `Successfully deleted ${modelName} model`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Text fontWeight="bold" mb={2}>Available Models</Text>
        
        {AVAILABLE_MODELS.map(modelName => {
          const isDownloaded = downloadedModels.includes(modelName);
          const size = modelSizes[modelName] || 0;
          
          return (
            <HStack key={modelName} justify="space-between" p={2} borderWidth="1px" borderRadius="md">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">{modelName}</Text>
                <Text fontSize="sm" color="gray.600">{size}MB</Text>
              </VStack>

              <HStack>
                {isDownloaded ? (
                  <>
                    <Badge colorScheme="green">Downloaded</Badge>
                    <IconButton
                      aria-label="Delete model"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      isDisabled={modelName === settings?.whisperModel}
                      onClick={() => handleDelete(modelName)}
                    />
                  </>
                ) : (
                  <Button
                    leftIcon={<DownloadIcon />}
                    size="sm"
                    colorScheme="blue"
                    isLoading={isDownloading}
                    onClick={() => handleDownload(modelName)}
                  >
                    Download
                  </Button>
                )}
              </HStack>
            </HStack>
          );
        })}

        {isLoadingModels && <Progress size="xs" isIndeterminate />}
      </VStack>
    </Box>
  );
};