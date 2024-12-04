import React from 'react';
import { ChakraProvider, Grid, GridItem } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileSelection } from './components/FileSelection';
import { TranscriptionPanel } from './components/TranscriptionPanel';
import { SettingsPanel } from './components/SettingsPanel';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <Grid
          templateAreas={`
            "files transcription settings"
          `}
          gridTemplateColumns={'300px 1fr 250px'}
          h="100vh"
          gap="1"
          p="2"
        >
          <GridItem area="files" bg="gray.50" borderRadius="md" overflow="auto">
            <FileSelection />
          </GridItem>

          <GridItem area="transcription" bg="white" borderRadius="md" overflow="auto">
            <TranscriptionPanel />
          </GridItem>

          <GridItem area="settings" bg="gray.50" borderRadius="md">
            <SettingsPanel />
          </GridItem>
        </Grid>
      </ChakraProvider>
    </QueryClientProvider>
  );
};