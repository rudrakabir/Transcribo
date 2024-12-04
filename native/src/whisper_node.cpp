#include "whisper_node.h"
#include <thread>
#include <chrono>

Napi::FunctionReference WhisperContext::constructor;

Napi::Object WhisperContext::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "WhisperContext", {
        InstanceMethod("loadModel", &WhisperContext::LoadModel),
        InstanceMethod("transcribe", &WhisperContext::Transcribe),
        InstanceMethod("release", &WhisperContext::Release),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("WhisperContext", func);
    return exports;
}

WhisperContext::WhisperContext(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<WhisperContext>(info), ctx(nullptr), modelLoaded(false) {
}

WhisperContext::~WhisperContext() {
    if (ctx) {
        whisper_free(ctx);
        ctx = nullptr;
    }
}

Napi::Value WhisperContext::LoadModel(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string modelPath = info[0].As<Napi::String>().Utf8Value();

    if (ctx) {
        whisper_free(ctx);
        ctx = nullptr;
        modelLoaded = false;
    }

    whisper_context_params params = whisper_context_default_params();
    ctx = whisper_init_from_file_with_params(modelPath.c_str(), params);
    
    if (!ctx) {
        Napi::Error::New(env, "Failed to load model").ThrowAsJavaScriptException();
        return env.Null();
    }

    modelLoaded = true;
    return Napi::Boolean::New(env, true);
}

Napi::Value WhisperContext::Transcribe(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!modelLoaded || !ctx) {
        Napi::Error::New(env, "Model not loaded").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (info.Length() < 2 || !info[0].IsTypedArray() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    auto audioArray = info[0].As<Napi::TypedArray>();
    if (audioArray.TypedArrayType() != napi_float32_array) {
        Napi::TypeError::New(env, "First argument must be Float32Array").ThrowAsJavaScriptException();
        return env.Null();
    }

    auto float32Array = info[0].As<Napi::Float32Array>();
    auto options = info[1].As<Napi::Object>();
    
    std::unique_ptr<CallbackData> callbackData;
    if (options.Has("onProgress") && options.Get("onProgress").IsFunction()) {
        auto callback = options.Get("onProgress").As<Napi::Function>();
        callbackData = std::make_unique<CallbackData>(callback);
    }

    try {
        auto result = ProcessTranscription(
            float32Array.Data(),
            float32Array.ElementLength(),
            options,
            callbackData.get()
        );

        auto resultObj = Napi::Object::New(env);
        resultObj.Set("text", result.text);
        resultObj.Set("language", result.language);
        resultObj.Set("duration", result.duration);

        auto segments = Napi::Array::New(env, result.segments.size());
        for (size_t i = 0; i < result.segments.size(); i++) {
            auto segment = Napi::Object::New(env);
            segment.Set("start", result.segments[i].start);
            segment.Set("end", result.segments[i].end);
            segment.Set("text", result.segments[i].text);
            segment.Set("confidence", result.segments[i].confidence);
            segments.Set(i, segment);
        }
        resultObj.Set("segments", segments);

        return resultObj;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

WhisperContext::TranscriptionResult WhisperContext::ProcessTranscription(
    const float* audioData,
    size_t audioLength,
    const Napi::Object& options,
    CallbackData* callbackData
) {
    whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    
    if (options.Has("language") && options.Get("language").IsString()) {
        params.language = options.Get("language").As<Napi::String>().Utf8Value().c_str();
    }

    if (options.Has("translate") && options.Get("translate").IsBoolean()) {
        params.translate = options.Get("translate").As<Napi::Boolean>().Value();
    }

    if (options.Has("threads") && options.Get("threads").IsNumber()) {
        params.n_threads = options.Get("threads").As<Napi::Number>().Int32Value();
    }

    if (callbackData) {
        params.progress_callback = [](struct whisper_context*, struct whisper_state*, int progress, void* user_data) {
            auto data = static_cast<CallbackData*>(user_data);
            data->callback.Call({Napi::Number::New(data->callback.Env(), progress / 100.0)});
        };
        params.progress_callback_user_data = callbackData;
    }

    if (whisper_full(ctx, params, audioData, audioLength) != 0) {
        throw std::runtime_error("Failed to process audio");
    }

    TranscriptionResult result;
    result.text = "";
    result.duration = static_cast<double>(audioLength) / WHISPER_SAMPLE_RATE;

    int lang_id = whisper_full_lang_id(ctx);
    result.language = whisper_lang_str(lang_id);

    const int n_segments = whisper_full_n_segments(ctx);
    for (int i = 0; i < n_segments; i++) {
        const char* text = whisper_full_get_segment_text(ctx, i);
        result.text += text;
        if (i < n_segments - 1) result.text += " ";

        double start = whisper_full_get_segment_t0(ctx, i) * 0.01;
        double end = whisper_full_get_segment_t1(ctx, i) * 0.01;

        float confidence = 0.0f;
        int n_tokens = whisper_full_n_tokens(ctx, i);
        for (int j = 0; j < n_tokens; j++) {
            confidence += whisper_full_get_token_p(ctx, i, j);
        }
        confidence = n_tokens > 0 ? confidence / n_tokens : 0.0f;

        result.segments.push_back({start, end, text, confidence});
    }

    return result;
}

Napi::Value WhisperContext::Release(const Napi::CallbackInfo& info) {
    if (ctx) {
        whisper_free(ctx);
        ctx = nullptr;
        modelLoaded = false;
    }
    return info.Env().Undefined();
}