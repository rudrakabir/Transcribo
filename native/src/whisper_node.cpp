                                        const std::string& text, float confidence) {
    auto segment = Napi::Object::New(env);
    
    segment.Set("id", Napi::Number::New(env, id));
    segment.Set("start", Napi::Number::New(env, start));
    segment.Set("end", Napi::Number::New(env, end));
    segment.Set("text", Napi::String::New(env, text));
    segment.Set("confidence", Napi::Number::New(env, confidence));
    
    return segment;
}

Napi::Value WhisperContext::CreateTranscriptionResult(const Napi::Env& env, 
                                                    const TranscriptionResult& result) {
    auto jsResult = Napi::Object::New(env);
    
    jsResult.Set("text", Napi::String::New(env, result.text));
    jsResult.Set("language", Napi::String::New(env, result.language));
    jsResult.Set("duration", Napi::Number::New(env, result.duration));
    jsResult.Set("modelType", Napi::String::New(env, result.modelType));
    
    auto segments = Napi::Array::New(env, result.segments.size());
    for (size_t i = 0; i < result.segments.size(); i++) {
        const auto& seg = result.segments[i];
        segments[i] = CreateSegment(env, seg.id, seg.start, seg.end, 
                                  seg.text, seg.confidence);
    }
    jsResult.Set("segments", segments);
    
    return jsResult;
}