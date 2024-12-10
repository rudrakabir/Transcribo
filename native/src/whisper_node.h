#pragma once

#include <napi.h>
#include <whisper.h>
#include <memory>
#include <mutex>
#include <string>
#include <vector>

struct WhisperSegment {
    int id;
    double start;
    double end;
    std::string text;
    float confidence;
};

class WhisperContext : public Napi::ObjectWrap<WhisperContext> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    WhisperContext(const Napi::CallbackInfo& info);
    ~WhisperContext();

private:
    static Napi::FunctionReference constructor;
    struct whisper_context* ctx_;
    std::mutex mutex_;
    bool initialized_;
    std::string model_path_; // Store model path for potential reloading

    Napi::Value LoadModel(const Napi::CallbackInfo& info);
    Napi::Value Transcribe(const Napi::CallbackInfo& info);
    Napi::Value Release(const Napi::CallbackInfo& info);
    Napi::Value GetInfo(const Napi::CallbackInfo& info);

    struct TranscriptionParams {
        std::vector<float> audioData;
        std::string language;
        bool translate;
        bool useGPU;
        int threads;
        bool speedUp;
        std::string initialPrompt;
        Napi::Function progressCallback;
    };

    struct TranscriptionResult {
        std::string text;
        std::vector<WhisperSegment> segments;
        std::string language;
        double duration;
        std::string modelType;
    };

    Napi::Value CreateSegment(const Napi::Env& env, int id, double start, double end, 
                             const std::string& text, float confidence);
    Napi::Value CreateTranscriptionResult(const Napi::Env& env, const TranscriptionResult& result);
    bool ReinitializeContext(); // Helper to reinit context if needed
};