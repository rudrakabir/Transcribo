cmd_Release/whisper.node := c++ -bundle -undefined dynamic_lookup -Wl,-search_paths_first -mmacosx-version-min=14.0 -arch arm64 -L./Release -stdlib=libc++  -o Release/whisper.node Release/obj.target/whisper/native/src/binding.o Release/obj.target/whisper/native/src/whisper_node.o Release/nothing.a /Users/rudrakabir/Desktop/Transcribo/native/whisper/libwhisper.a
