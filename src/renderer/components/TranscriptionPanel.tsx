import React, { useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Progress,
  Button,
  useToast,
  Textarea,
  HStack,
  IconButton
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { AudioFile, TranscriptionSegment } from '../../shared/types';
import { useTranscription } from '../hooks/useTranscription';

export const TranscriptionPanel: React.FC = () => {
  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const toast = useToast();
  
  const {
    activeFile,
    transcription,
    progress,
    isTranscribing,
    startTranscription,
    cancelTranscription,
    updateSegmentText,
  } = useTranscription();

  if (!activeFile) {
    return (
      <Box p={8} textAlign="center" color="gray.500">
        <Text>Select an audio file to start transcription</Text>
      </Box>
    );
  }

  const handleEdit = (index: number) => {
    setEditingSegmentId(index);
  };

  const handleSave = async (index: number, newText: string) => {
    try {
      await updateSegmentText(index, newText);
      setEditingSegmentId(null);
      toast({
        title: "Segment updated",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Failed to update segment",
        status: "error",
        duration: 3000,
      });
    }
  };

  const renderSegment = (segment: TranscriptionSegment, index: number) => {
    const isEditing = editingSegmentId === index;

    return (
      <Box key={index} p={2} borderBottom="1px" borderColor="gray.200">
        <Text fontSize="xs" color="gray.500">
          {formatTime(segment.start)} - {formatTime(segment.end)}
        </Text>
        
        {isEditing ? (
          <HStack mt={1}>
            <Textarea
              defaultValue={segment.text}
              size="sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave(index, e.currentTarget.value);
                }
              }}
            />
            <VStack>
              <IconButton
                aria-label="Save edit"
                icon={<CheckIcon />}
                size="sm"
                colorScheme="green"
                onClick={(e) => {
                  const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                  handleSave(index, textarea.value);
                }}
              />
              <IconButton
                aria-label="Cancel edit"
                icon={<CloseIcon />}
                size="sm"
                onClick={() => setEditingSegmentId(null)}
              />
            </VStack>
          </HStack>
        ) : (
          <HStack justify="space-between" mt={1}>
            <Text>{segment.text}</Text>
            <IconButton
              aria-label="Edit segment"
              icon={<EditIcon />}
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(index)}
            />
          </HStack>
        )}
      </Box>
    );
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Box>
          <Text fontSize="lg" fontWeight="medium">{activeFile.fileName}</Text>
          <Text fontSize="sm" color="gray.600">
            {formatDuration(activeFile.duration || 0)}
          </Text>
        </Box>

        {isTranscribing ? (
          <Box>
            <Progress value={progress} size="sm" mb={2} />
            <Button
              colorScheme="red"
              size="sm"
              onClick={cancelTranscription}
            >
              Cancel
            </Button>
          </Box>
        ) : (
          activeFile.transcriptionStatus !== 'completed' && (
            <Button
              colorScheme="blue"
              onClick={() => startTranscription(activeFile.id)}
              isLoading={activeFile.transcriptionStatus === 'pending'}
            >
              Start Transcription
            </Button>
          )
        )}

        {transcription?.segments && (
          <Box
            mt={4}
            maxH="calc(100vh - 200px)"
            overflowY="auto"
            borderWidth="1px"
            borderRadius="md"
          >
            {transcription.segments.map((segment, index) => 
              renderSegment(segment, index)
            )}
          </Box>
        )}
      </VStack>
    </Box>
  );
};

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes} min ${remainingSeconds} sec`;
}