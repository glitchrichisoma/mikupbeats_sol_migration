/**
 * Audio file format detection, validation, and conversion utilities
 * Converts any audio format to MP3 for preview playback
 */

/**
 * Detects if a file is an audio file based on MIME type and extension
 */
export function isAudioFile(file: File): boolean {
  const audioMimeTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/ogg",
    "audio/webm",
    "audio/aac",
    "audio/m4a",
    "audio/x-m4a",
    "audio/flac",
  ];

  // Check MIME type
  if (audioMimeTypes.includes(file.type)) {
    return true;
  }

  // Check file extension as fallback
  const extension = file.name.split(".").pop()?.toLowerCase();
  const audioExtensions = ["mp3", "wav", "ogg", "webm", "aac", "m4a", "flac"];

  return audioExtensions.includes(extension || "");
}

/**
 * Validates that a file is a supported audio format
 * Throws error if not audio
 */
export function validateAudioFile(file: File): void {
  if (!isAudioFile(file)) {
    throw new Error(
      `Invalid audio file format. Please upload MP3 or WAV files. Received: ${file.type || "unknown type"}`,
    );
  }
}

/**
 * Converts any audio file to a browser-compatible format (WebM/Opus or MP3)
 * This ensures playback compatibility across all browsers
 */
export async function convertToPlayableAudio(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // First validate it's an audio file
    if (!isAudioFile(file)) {
      reject(new Error("File is not a valid audio format"));
      return;
    }

    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.src = objectUrl;
    audio.preload = "metadata";

    audio.addEventListener("loadedmetadata", async () => {
      try {
        // Check if browser can play this audio format
        const canPlay = audio.canPlayType(file.type);

        // If browser can play it directly, return original file
        if (canPlay === "probably" || canPlay === "maybe") {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }

        // Otherwise, convert using MediaRecorder
        await audio.play();

        // Create AudioContext for processing
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audio);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);

        // Determine best supported MIME type
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "audio/mp4";

        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType,
          audioBitsPerSecond: 128000,
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const convertedBlob = new Blob(chunks, { type: mimeType });
          const extension = mimeType.includes("webm") ? "webm" : "mp4";
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const convertedFile = new File(
            [convertedBlob],
            `${baseName}_converted.${extension}`,
            { type: mimeType },
          );

          audio.pause();
          audioContext.close();
          URL.revokeObjectURL(objectUrl);
          resolve(convertedFile);
        };

        mediaRecorder.onerror = (error) => {
          audio.pause();
          audioContext.close();
          URL.revokeObjectURL(objectUrl);
          reject(new Error(`Conversion failed: ${error}`));
        };

        // Start recording
        mediaRecorder.start();

        // Stop after audio ends or after reasonable timeout
        audio.onended = () => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        };

        // Safety timeout (5 minutes max)
        setTimeout(() => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        }, 300000);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "Failed to load audio file. The file may be corrupted or in an unsupported format.",
        ),
      );
    });
  });
}

/**
 * Processes an audio file for preview:
 * 1. Validates it's audio
 * 2. Converts to playable format if needed
 * 3. Trims to 45 seconds
 */
export async function processAudioForPreview(
  file: File,
  onProgress?: (stage: string) => void,
): Promise<File> {
  try {
    // Step 1: Validate
    onProgress?.("Validating audio file...");
    validateAudioFile(file);

    // Step 2: Convert if needed
    onProgress?.("Converting to compatible format...");
    const playableFile = await convertToPlayableAudio(file);

    // Step 3: Check duration and trim if needed
    onProgress?.("Checking duration...");
    const duration = await getAudioDuration(playableFile);

    if (duration > 45) {
      onProgress?.("Trimming to 45 seconds...");
      const trimmedFile = await trimAudioTo45Seconds(playableFile);
      return trimmedFile;
    }

    return playableFile;
  } catch (error: any) {
    throw new Error(`Audio processing failed: ${error.message}`);
  }
}

/**
 * Gets the duration of an audio file in seconds
 */
async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.src = objectUrl;
    audio.preload = "metadata";

    audio.addEventListener("loadedmetadata", () => {
      const duration = Math.floor(audio.duration);
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to read audio duration"));
    });
  });
}

/**
 * Trims audio to 45 seconds using MediaRecorder
 */
async function trimAudioTo45Seconds(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.src = objectUrl;
    audio.preload = "metadata";

    audio.addEventListener("loadedmetadata", async () => {
      try {
        await audio.play();

        // Create AudioContext for processing
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audio);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType,
          audioBitsPerSecond: 128000,
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const trimmedBlob = new Blob(chunks, { type: mimeType });
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const trimmedFile = new File([trimmedBlob], `${baseName}_45s.webm`, {
            type: mimeType,
          });

          audio.pause();
          audioContext.close();
          URL.revokeObjectURL(objectUrl);
          resolve(trimmedFile);
        };

        mediaRecorder.onerror = (error) => {
          audio.pause();
          audioContext.close();
          URL.revokeObjectURL(objectUrl);
          reject(new Error(`Trimming failed: ${error}`));
        };

        mediaRecorder.start();

        // Stop after 45 seconds
        setTimeout(() => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
          audio.pause();
        }, 45000);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load audio for trimming"));
    });
  });
}
