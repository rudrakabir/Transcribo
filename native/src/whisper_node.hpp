#pragma once

#include <napi.h>
#include "whisper.h"

class WhisperContext : public Napi::ObjectWrap<WhisperContext> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    WhisperContext(const Napi::CallbackInfo& info);
    ~WhisperContext();

private:
    static Napi::FunctionReference constructor;
    struct whisper_context* ctx;

    Napi::Value Transcribe(const Napi::CallbackInfo& info);
    Napi::Value LoadModel(const Napi::CallbackInfo& info);
};