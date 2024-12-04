import React from 'react';
import { Box, Button, VStack, List, ListItem, Text, Badge, IconButton, HStack } from '@chakra-ui/react';
import { useFileSelection } from '../hooks/useFileSelection';
import { AudioFile } from '../../shared/types';
import { DeleteIcon, RepeatIcon } from '@chakra-ui/icons';

const statusColorScheme: Record<AudioFile['transcriptionStatus'], string> = {
  unprocessed: 'gray',
  pending: 'yellow',
  processing: 'blue',
  completed: 'green',
  error: 'red'
};

export const FileSelection: React.FC = () => {
  const { files, selectFiles, selectDirectory, deleteFile, retryTranscription } = useFileSelection();

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <HStack>
          <Button onClick={selectFiles} colorScheme="blue">Select Files</Button>
          <Button onClick={selectDirectory} colorScheme="teal">Select Directory</Button>
        </HStack>

        <List spacing={2}>
          {files.map(file => (
            <ListItem key={file.id} p={2} borderWidth="1px" borderRadius="md">
              <HStack justify="space-between">
                <VStack align="start" flex={1}>
                  <Text fontWeight="medium">{file.fileName}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                    {file.duration && ` • ${Math.round(file.duration)}s`}
                  </Text>
                </VStack>
                
                <HStack>
                  <Badge colorScheme={statusColorScheme[file.transcriptionStatus]}>
                    {file.transcriptionStatus}
                  </Badge>
                  
                  {file.transcriptionStatus === 'error' && (
                    <IconButton
                      aria-label="Retry transcription"
                      icon={<RepeatIcon />}
                      size="sm"
                      onClick={() => retryTranscription(file.id)}
                    />
                  )}
                  
                  <IconButton
                    aria-label="Delete file"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => deleteFile(file.id)}
                  />
                </HStack>
              </HStack>
            </ListItem>
          ))}
        </List>
      </VStack>
    </Box>
  );
};