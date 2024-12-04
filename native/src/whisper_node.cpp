#include "whisper_node.hpp"
#include <iostream>

Napi::FunctionReference WhisperContext::constructor;

Napi::Object WhisperContext::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "WhisperContext", {
        InstanceMethod("loadModel", &WhisperContext::LoadModel),
        InstanceMethod("transcribe", &WhisperContext::Transcribe),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("WhisperContext", func);
    return exports;
}

WhisperContext::WhisperContext(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<WhisperContext>(info) {
    ctx = nullptr;
}

WhisperContext::~WhisperContext() {
    if (ctx) {
        whisper_free(ctx);
    }
}

Napi::Value WhisperContext::LoadModel(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string model_path = info[0].As<Napi::String>().Utf8Value();
    
    if (ctx) {
        whisper_free(ctx);
    }

    ctx = whisper_init_from_file(model_path.c_str());
    
    if (!ctx) {
        Napi::Error::New(env, "Failed to load model").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    return Napi::Boolean::New(env, true);
}

Napi::Value WhisperContext::Transcribe(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!ctx) {
        Napi::Error::New(env, "Model not loaded").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    if (info.Length() < 1 || !info[0].IsTypedArray()) {
        Napi::TypeError::New(env, "Float32Array expected").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    return Napi::String::New(env, "Transcription not implemented yet");
}
