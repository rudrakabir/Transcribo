import React from 'react';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Switch,
  Button,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import { useSettings } from '../hooks/useSettings';
import { ModelManager } from './ModelManager';

export const SettingsPanel: React.FC = () => {
  const toast = useToast();
  const {
    settings,
    isLoading,
    updateSettings,
    addWatchFolder,
    removeWatchFolder
  } = useSettings();

  if (isLoading || !settings) {
    return (
      <Box p={4}>
        <Text>Loading settings...</Text>
      </Box>
    );
  }

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ whisperModel: e.target.value as any });
  };

  const handleAutoTranscribeToggle = () => {
    updateSettings({ autoTranscribe: !settings.autoTranscribe });
  };

  const handleGPUToggle = () => {
    updateSettings({ useGPU: !settings.useGPU });
  };

  const handleMaxConcurrentChange = (_: string, value: number) => {
    updateSettings({ maxConcurrentTranscriptions: value });
  };

  const handleAddWatchFolder = async () => {
    try {
      await addWatchFolder();
      toast({
        title: "Watch folder added",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Failed to add watch folder",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleRemoveWatchFolder = async (folder: string) => {
    try {
      await removeWatchFolder(folder);
      toast({
        title: "Watch folder removed",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Failed to remove watch folder",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box p={4} h="100%" overflowY="auto">
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold">Settings</Text>

        <Accordion allowMultiple defaultIndex={[0]}>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  Transcription Models
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Selected Model</FormLabel>
                  <Select value={settings.whisperModel} onChange={handleModelChange}>
                    <option value="tiny.en">Tiny.en (Fast, English Only)</option>
                    <option value="tiny">Tiny (Fast, All Languages)</option>
                    <option value="base.en">Base.en (English Only)</option>
                    <option value="base">Base (All Languages)</option>
                    <option value="small.en">Small.en (English Only)</option>
                    <option value="small">Small (All Languages)</option>
                    <option value="medium.en">Medium.en (English Only)</option>
                    <option value="medium">Medium (All Languages)</option>
                    <option value="large-v1">Large v1</option>
                    <option value="large">Large</option>
                  </Select>
                </FormControl>
                <Divider />
                <ModelManager />
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  Performance Settings
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Max Concurrent Transcriptions</FormLabel>
                  <NumberInput
                    min={1}
                    max={5}
                    value={settings.maxConcurrentTranscriptions}
                    onChange={handleMaxConcurrentChange}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Use GPU (if available)</FormLabel>
                  <Switch
                    isChecked={settings.useGPU}
                    onChange={handleGPUToggle}
                  />
                </FormControl>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  Automation
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack spacing={4} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Auto-Transcribe New Files</FormLabel>
                  <Switch
                    isChecked={settings.autoTranscribe}
                    onChange={handleAutoTranscribeToggle}
                  />
                </FormControl>

                <Box>
                  <FormLabel>Watch Folders</FormLabel>
                  <VStack align="stretch" spacing={2}>
                    {settings.watchFolders.map((folder) => (
                      <Box
                        key={folder}
                        p={2}
                        bg="gray.50"
                        borderRadius="md"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text fontSize="sm" isTruncated maxW="180px">{folder}</Text>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleRemoveWatchFolder(folder)}
                        >
                          Remove
                        </Button>
                      </Box>
                    ))}
                    <Button
                      size="sm"
                      onClick={handleAddWatchFolder}
                      colorScheme="blue"
                    >
                      Add Watch Folder
                    </Button>
                  </VStack>
                </Box>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>
    </Box>
  );
};