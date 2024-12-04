"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs"); // Import sync version separately
const child_process_1 = require("child_process");
async;
getAudioMetadata(filePath, string);
Promise < types_1.AudioMetadata > {
    return: new Promise((resolve, reject) => {
        const ffprobe = (0, child_process_1.spawn)('ffprobe', [
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            filePath
        ]);
        let output = '';
        ffprobe.stdout.on('data', (data) => {
            output += data.toString();
        });
        ffprobe.on('close', (code) => {
            if (code === 0) {
                try {
                    const data = JSON.parse(output);
                    const audioStream = data.streams.find((stream) => stream.codec_type === 'audio');
                    if (!audioStream) {
                        throw new Error('No audio stream found');
                    }
                    const stats = (0, fs_1.statSync)(filePath); // Using the sync version
                    resolve({
                        format: data.format.format_name,
                        size: stats.size,
                        duration: parseFloat(data.format.duration),
                        sampleRate: parseInt(audioStream.sample_rate),
                        channels: audioStream.channels,
                        bitrate: audioStream.bit_rate ? parseInt(audioStream.bit_rate) : undefined,
                        codec: audioStream.codec_name
                    });
                }
                catch (error) {
                    reject(new Error('Failed to parse audio metadata'));
                }
            }
            else {
                reject(new Error('FFprobe analysis failed'));
            }
        });
        ffprobe.on('error', reject);
    })
};
// ... (rest of the file remains the same)
//# sourceMappingURL=audio-processor.js.map