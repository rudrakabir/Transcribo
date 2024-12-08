#ifndef WHISPER_NODE_H
#define WHISPER_NODE_H

#include <napi.h>
#include "whisper.h"
#include <string>
#include <vector>
#include <memory>

// Define callback data structure
struct CallbackData {
    Napi::FunctionReference callback;
    explicit CallbackData(const Napi::Function& func) : callback(Napi::Persistent(func)) {}
};

class WhisperContext : public Napi::ObjectWrap<WhisperContext> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    WhisperContext(const Napi::CallbackInfo& info);
    ~WhisperContext();

private:
    static Napi::FunctionReference constructor;

    Napi::Value LoadModel(const Napi::CallbackInfo& info);
    Napi::Value Transcribe(const Napi::CallbackInfo& info);
    Napi::Value Release(const Napi::CallbackInfo& info);

    struct whisper_context* ctx;
    bool modelLoaded;

    // Helper methods
    struct Segment {
        double start;
        double end;
        std::string text;
        float confidence;
    };

    struct TranscriptionResult {
        std::string text;
        std::vector<Segment> segments;
        std::string language;
        double duration;
    };

    TranscriptionResult ProcessTranscription(
        const float* audioData,
        size_t audioLength,
        const Napi::Object& options,
        CallbackData* callbackData
    );
};

#endif // WHISPER_NODE_H