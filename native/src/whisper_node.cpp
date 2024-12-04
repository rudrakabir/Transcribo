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

  // Free existing context if any
  if (ctx) {
    whisper_free(ctx);
    ctx = nullptr;
    modelLoaded = false;
  }

  ctx = whisper_init_from_file(modelPath.c_str());
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

  if (info.Length() < 2 || !info[0].IsFloat32Array() || !info[1].IsObject()) {
    Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  auto audioArray = info[0].As<Napi::Float32Array>();
  auto options = info[1].As<Napi::Object>();
  Napi::Function progressCallback;

  if (options.Has("onProgress") && options.Get("onProgress").IsFunction()) {
    progressCallback = options.Get("onProgress").As<Napi::Function>();
  }

  try {
    auto result = ProcessTranscription(
      audioArray.Data(),
      audioArray.ElementLength(),
      options,
      progressCallback
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
  const Napi::Function& progressCallback
) {
  whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
  
  // Set parameters from options
  if (options.Has("language") && options.Get("language").IsString()) {
    params.language = options.Get("language").As<Napi::String>().Utf8Value().c_str();
  }

  if (options.Has("translate") && options.Get("translate").IsBoolean()) {
    params.translate = options.Get("translate").As<Napi::Boolean>().Value();
  }

  if (options.Has("threads") && options.Get("threads").IsNumber()) {
    params.n_threads = options.Get("threads").As<Napi::Number>().Int32Value();
  }

  // Process audio in chunks for progress updates
  const size_t CHUNK_SIZE = 16000 * 30; // 30 seconds chunks
  size_t processedSamples = 0;

  while (processedSamples < audioLength) {
    size_t chunkSize = std::min(CHUNK_SIZE, audioLength - processedSamples);
    
    if (whisper_full(ctx, params, audioData + processedSamples, chunkSize) != 0) {
      throw std::runtime_error("Failed to process audio chunk");
    }

    processedSamples += chunkSize;

    // Report progress if callback provided
    if (!progressCallback.IsEmpty()) {
      double progress = static_cast<double>(processedSamples) / audioLength;
      progressCallback.Call({Napi::Number::New(progressCallback.Env(), progress)});
    }
  }

  // Collect results
  TranscriptionResult result;
  result.text = whisper_full_get_text(ctx);
  result.language = whisper_full_get_language(ctx);
  result.duration = static_cast<double>(audioLength) / WHISPER_SAMPLE_RATE;

  const int n_segments = whisper_full_n_segments(ctx);
  for (int i = 0; i < n_segments; i++) {
    const char* text = whisper_full_get_segment_text(ctx, i);
    double start = whisper_full_get_segment_t0(ctx, i) * 0.01;
    double end = whisper_full_get_segment_t1(ctx, i) * 0.01;
    float confidence = static_cast<float>(whisper_full_get_segment_confidence(ctx, i));

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

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  return WhisperContext::Init(env, exports);
}

NODE_API_MODULE(whisper, Init)