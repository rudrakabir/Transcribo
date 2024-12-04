{
  "targets": [{
    "target_name": "whisper",
    "sources": [
      "native/src/binding.cpp",
      "native/src/whisper_node.cpp"
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")",
      "native/whisper",
      "native/whisper/include",
      "native/whisper/ggml/include",
      "native/whisper/ggml/src"
    ],
    "libraries": [
      "<(module_root_dir)/native/whisper/libwhisper.a"
    ],
    "dependencies": [
      "<!(node -p \"require('node-addon-api').gyp\")"
    ],
    "cflags!": ["-fno-exceptions"],
    "cflags_cc!": ["-fno-exceptions"],
    "cflags": ["-DNDEBUG"],
    "cflags_cc": ["-std=c++11", "-O3", "-DNDEBUG"],
    "xcode_settings": {
      "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
      "CLANG_CXX_LIBRARY": "libc++",
      "MACOSX_DEPLOYMENT_TARGET": "10.15",
      "OTHER_CFLAGS": [
        "-mmacosx-version-min=10.15",
        "-std=c++11",
        "-O3",
        "-DNDEBUG"
      ]
    },
    "defines": ["NAPI_CPP_EXCEPTIONS"]
  }]
}