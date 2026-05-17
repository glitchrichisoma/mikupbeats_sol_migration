/**
 * Unified media processor for audio and video preview files
 * Handles file type detection, validation, conversion, and trimming to 30 seconds
 * For video files, extracts audio track for unified audio player playback
 */

// Extend HTMLMediaElement types to include captureStream
interface HTMLVideoElementWithCapture extends HTMLVideoElement {
  captureStream(): MediaStream;
  mozCaptureStream?(): MediaStream;
}

interface HTMLAudioElementWithCapture extends HTMLAudioElement {
  captureStream?(): MediaStream;
  mozCaptureStream?(): MediaStream;
}

export type MediaType = "audio" | "video";

/**
 * Detects if a file is an audio file
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

  if (audioMimeTypes.includes(file.type)) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const audioExtensions = ["mp3", "wav", "ogg", "webm", "aac", "m4a", "flac"];

  return audioExtensions.includes(extension || "");
}

/**
 * Detects if a file is a video file
 */
export function isVideoFile(file: File): boolean {
  const videoMimeTypes = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
  ];

  if (videoMimeTypes.includes(file.type)) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const videoExtensions = ["mp4", "webm", "ogg", "mov", "avi", "mkv"];

  return videoExtensions.includes(extension || "");
}

/**
 * Detects the media type of a file
 */
export function detectMediaType(file: File): MediaType | null {
  if (isAudioFile(file)) return "audio";
  if (isVideoFile(file)) return "video";
  return null;
}

/**
 * Validates that a file is a supported media format
 */
export function validateMediaFile(file: File): MediaType {
  const mediaType = detectMediaType(file);

  if (!mediaType) {
    throw new Error(
      `Invalid media file format. Please upload audio (MP3, WAV, M4A) or video (MP4, WebM) files. Received: ${file.type || "unknown type"}`,
    );
  }

  return mediaType;
}

/**
 * Gets the duration of a media file in seconds
 */
export async function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const mediaType = detectMediaType(file);

    if (!mediaType) {
      reject(new Error("File must be audio or video"));
      return;
    }

    const element =
      mediaType === "video" ? document.createElement("video") : new Audio();
    const objectUrl = URL.createObjectURL(file);

    element.src = objectUrl;
    element.preload = "metadata";

    element.addEventListener("loadedmetadata", () => {
      const duration = Math.floor(element.duration);
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    });

    element.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load media file"));
    });
  });
}

/**
 * Processes media for preview playback in unified audio player
 * For video files: extracts audio track
 * For audio files: converts to compatible format if needed
 * All files: trims to 30 seconds
 */
export async function processMediaForPreview(
  file: File,
  onProgress?: (stage: string) => void,
): Promise<{ file: File; mediaType: MediaType }> {
  try {
    // Step 1: Validate and detect type
    onProgress?.("Detecting file type...");
    const mediaType = validateMediaFile(file);

    // Step 2: Extract audio from video or convert audio to compatible format
    onProgress?.("Processing for unified playback...");
    let processedFile = await extractAudioForUnifiedPlayer(
      file,
      mediaType,
      onProgress,
    );

    // Step 3: Check duration and trim if needed
    onProgress?.("Checking duration...");
    const duration = await getMediaDuration(processedFile);

    if (duration > 30) {
      onProgress?.("Trimming to 30 seconds...");
      processedFile = await trimMediaTo30Seconds(processedFile, "audio"); // Always audio after extraction
    }

    return { file: processedFile, mediaType };
  } catch (error: any) {
    throw new Error(`Media processing failed: ${error.message}`);
  }
}

/**
 * Extracts audio from video or converts audio to unified playback format
 * This ensures all previews (audio and video) play through the same audio player
 */
async function extractAudioForUnifiedPlayer(
  file: File,
  mediaType: MediaType,
  onProgress?: (stage: string) => void,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const element =
      mediaType === "video"
        ? (document.createElement("video") as HTMLVideoElementWithCapture)
        : (new Audio() as HTMLAudioElementWithCapture);

    const objectUrl = URL.createObjectURL(file);
    element.src = objectUrl;
    element.preload = "metadata";

    if (mediaType === "video") {
      (element as HTMLVideoElement).muted = false;
      onProgress?.("Extracting audio from video...");
    } else {
      onProgress?.("Converting to compatible format...");
    }

    element.addEventListener("loadedmetadata", async () => {
      try {
        // Get media stream
        let stream: MediaStream;

        if (mediaType === "video") {
          const videoEl = element as HTMLVideoElementWithCapture;
          if (typeof videoEl.captureStream === "function") {
            stream = videoEl.captureStream();
          } else if (typeof videoEl.mozCaptureStream === "function") {
            stream = videoEl.mozCaptureStream();
          } else {
            throw new Error("captureStream not supported");
          }
        } else {
          const audioEl = element as HTMLAudioElementWithCapture;
          if (typeof audioEl.captureStream === "function") {
            stream = audioEl.captureStream();
          } else if (typeof audioEl.mozCaptureStream === "function") {
            stream = audioEl.mozCaptureStream();
          } else {
            throw new Error("captureStream not supported");
          }
        }

        // Extract only audio tracks for unified player
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          throw new Error("No audio track found in media file");
        }

        // Create audio-only stream
        const audioStream = new MediaStream(audioTracks);

        // Use audio WebM format for unified playback
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const mediaRecorder = new MediaRecorder(audioStream, {
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
          const audioBlob = new Blob(chunks, { type: mimeType });
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const audioFile = new File([audioBlob], `${baseName}_audio.webm`, {
            type: mimeType,
          });

          for (const track of stream.getTracks()) track.stop();
          element.pause();
          URL.revokeObjectURL(objectUrl);
          resolve(audioFile);
        };

        mediaRecorder.onerror = (error) => {
          for (const track of stream.getTracks()) track.stop();
          URL.revokeObjectURL(objectUrl);
          reject(new Error(`Audio extraction failed: ${error}`));
        };

        mediaRecorder.start();

        const playPromise = element.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            for (const track of stream.getTracks()) track.stop();
            URL.revokeObjectURL(objectUrl);
            reject(new Error(`Playback failed: ${error}`));
          });
        }

        // Stop when media ends or after timeout
        element.onended = () => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        };

        setTimeout(() => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
          element.pause();
        }, 300000); // 5 minute safety timeout
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    });

    element.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load media file"));
    });
  });
}

/**
 * Trims audio to exactly 30 seconds
 */
async function trimMediaTo30Seconds(
  file: File,
  _mediaType: MediaType,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const element = new Audio() as HTMLAudioElementWithCapture;

    const objectUrl = URL.createObjectURL(file);
    element.src = objectUrl;
    element.preload = "metadata";

    element.addEventListener("loadedmetadata", async () => {
      try {
        // Get audio stream
        let stream: MediaStream;

        if (typeof element.captureStream === "function") {
          stream = element.captureStream();
        } else if (typeof element.mozCaptureStream === "function") {
          stream = element.mozCaptureStream();
        } else {
          throw new Error("captureStream not supported");
        }

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const mediaRecorder = new MediaRecorder(stream, {
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
          const trimmedFile = new File([trimmedBlob], `${baseName}_30s.webm`, {
            type: mimeType,
          });

          for (const track of stream.getTracks()) track.stop();
          element.pause();
          URL.revokeObjectURL(objectUrl);
          resolve(trimmedFile);
        };

        mediaRecorder.onerror = (error) => {
          for (const track of stream.getTracks()) track.stop();
          URL.revokeObjectURL(objectUrl);
          reject(new Error(`Trimming failed: ${error}`));
        };

        mediaRecorder.start();
        element.currentTime = 0;

        const playPromise = element.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            for (const track of stream.getTracks()) track.stop();
            URL.revokeObjectURL(objectUrl);
            reject(new Error(`Playback failed: ${error}`));
          });
        }

        // Stop after exactly 30 seconds
        setTimeout(() => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
          element.pause();
        }, 30000);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    });

    element.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load media for trimming"));
    });
  });
}
