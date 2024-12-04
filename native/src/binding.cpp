#include <napi.h>
#include "whisper_node.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  return WhisperContext::Init(env, exports);
}

NODE_API_MODULE(whisper, InitAll)