# Whisper Node Implementation

This document explains the Node.js native binding implementation for Whisper.cpp, which allows using OpenAI's Whisper model directly in Node.js/Electron applications.

## Architecture Overview

The implementation consists of several key components:

1. **Node-API Wrapper** (`whisper_node.h`, `whisper_node.cpp`)
   - Provides JavaScript-friendly interface to Whisper.cpp
   - Handles type conversions and memory management
   - Manages async operations and callbacks

2. **Module Entry Point** (`binding.cpp`)
   - Initializes the native module
   - Registers the WhisperContext class

3. **Build Configuration** (`binding.gyp`)
   - Configures native module compilation
   - Sets compiler flags and dependencies
   - Manages platform-specific settings

## Core Components

### WhisperContext Class

The main interface class that wraps Whisper.cpp functionality:

```cpp
class WhisperContext : public Napi::ObjectWrap<WhisperContext> {
    // Core functionality
    Napi::Value LoadModel(const Napi::CallbackInfo& info);
    Napi::Value Transcribe(const Napi::CallbackInfo& info);
    Napi::Value Release(const Napi::CallbackInfo& info);
    
    // Internal state
    struct whisper_context* ctx;
    bool modelLoaded;
}
```

### Key Methods

1. **LoadModel**
   - Loads a Whisper model from file
   - Initializes the whisper context with parameters
   - Returns success/failure status

2. **Transcribe**
   - Processes audio data (Float32Array format)
   - Supports progress callbacks
   - Returns transcription results with segments

3. **Release**
   - Cleans up resources
   - Frees the whisper context

### Data Structures

1. **TranscriptionResult**
```cpp
struct TranscriptionResult {
    std::string text;              // Full transcription text
    std::vector<Segment> segments; // Individual segments
    std::string language;          // Detected language
    double duration;               // Audio duration
};
```

2. **Segment**
```cpp
struct Segment {
    double start;         // Start time in seconds
    double end;           // End time in seconds
    std::string text;     // Segment text
    float confidence;     // Confidence score
};
```

## Usage from JavaScript

```javascript
const whisper = require('./build/Release/whisper.node');

// Create instance
const context = new whisper.WhisperContext();

// Load model
await context.loadModel('path/to/model.bin');

// Transcribe audio
const result = await context.transcribe(audioData, {
    language: 'en',
    translate: false,
    onProgress: (progress) => console.log(`Progress: ${progress * 100}%`)
});

// Clean up
context.release();
```

## Build System

The module uses node-gyp for compilation with the following key settings:

1. **C++17 Features**
   - Required for modern C++ features
   - Enables better type safety and memory management

2. **Platform Support**
   - macOS: Targets version 14.0+
   - Windows: Uses MSVC with C++17
   - Linux: Standard GCC/Clang compilation

3. **Dependencies**
   - node-addon-api for N-API wrapper
   - Whisper.cpp library (statically linked)

## Performance Considerations

1. **Memory Management**
   - Uses RAII principles for resource management
   - Properly handles N-API cleanup
   - Manages Whisper context lifecycle

2. **Threading**
   - Main transcription runs on worker threads
   - Callbacks safely dispatch to JS thread
   - Progress updates don't block processing

3. **Error Handling**
   - Comprehensive error checking
   - Safe exception propagation to JavaScript
   - Resource cleanup on errors

## Limitations and Future Improvements

1. **Current Limitations**
   - Single model loaded at a time
   - Synchronous model loading
   - Basic error reporting

2. **Potential Improvements**
   - Async model loading
   - Multiple model support
   - Better memory management for large files
   - More configuration options
   - Streaming support

## Building and Testing

1. **Build Requirements**
   - Node.js and npm
   - C++17 compatible compiler
   - Python for node-gyp
   - Whisper.cpp dependencies

2. **Build Commands**
```bash
# Install dependencies
npm install

# Build the native module
node-gyp rebuild
```

3. **Testing**
   - Tests should be run after any modifications
   - Use provided test audio files
   - Verify memory usage during long runs

## Troubleshooting

Common issues and solutions:

1. **Build Errors**
   - Check C++ compiler version
   - Verify Whisper.cpp library compilation
   - Ensure correct macOS version targeting

2. **Runtime Errors**
   - Model loading failures: Check file paths
   - Memory issues: Monitor resource usage
   - Callback errors: Verify JS function context

## Maintenance and Updates

The implementation should be kept in sync with:

1. Whisper.cpp updates
2. Node.js N-API changes
3. Platform-specific requirements
4. Security patches