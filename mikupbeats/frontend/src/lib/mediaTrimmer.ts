/**
 * Trims audio or video files to a maximum duration of 30 seconds client-side
 * Returns a new File object with the trimmed content
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

export async function trimMediaTo30Seconds(file: File): Promise<File> {
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");

  if (!isVideo && !isAudio) {
    throw new Error("File must be audio or video");
  }

  return new Promise((resolve, reject) => {
    const mediaElement = isVideo
      ? (document.createElement("video") as HTMLVideoElementWithCapture)
      : (new Audio() as HTMLAudioElementWithCapture);
    const objectUrl = URL.createObjectURL(file);

    mediaElement.src = objectUrl;
    mediaElement.preload = "metadata";
    if (isVideo) {
      (mediaElement as HTMLVideoElement).muted = true;
    }

    mediaElement.addEventListener("loadedmetadata", async () => {
      const duration = mediaElement.duration;

      // If duration is 30 seconds or less, return original file
      if (duration <= 30) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }

      try {
        // Get media stream from element
        let stream: MediaStream;

        if (isVideo) {
          const videoEl = mediaElement as HTMLVideoElementWithCapture;
          if (typeof videoEl.captureStream === "function") {
            stream = videoEl.captureStream();
          } else if (typeof videoEl.mozCaptureStream === "function") {
            stream = videoEl.mozCaptureStream();
          } else {
            throw new Error("captureStream not supported in this browser");
          }
        } else {
          const audioEl = mediaElement as HTMLAudioElementWithCapture;
          if (typeof audioEl.captureStream === "function") {
            stream = audioEl.captureStream();
          } else if (typeof audioEl.mozCaptureStream === "function") {
            stream = audioEl.mozCaptureStream();
          } else {
            throw new Error("captureStream not supported in this browser");
          }
        }

        // Determine appropriate MIME type
        const mimeType = isVideo
          ? MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
            ? "video/webm;codecs=vp8,opus"
            : "video/webm"
          : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm";

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: isVideo ? 2500000 : undefined,
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

          // Create new file with original name but trimmed content
          const extension = isVideo ? "webm" : "webm";
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const trimmedFile = new File(
            [trimmedBlob],
            `${baseName}_trimmed.${extension}`,
            {
              type: mimeType,
            },
          );

          // Stop all tracks
          for (const track of stream.getTracks()) track.stop();
          URL.revokeObjectURL(objectUrl);
          resolve(trimmedFile);
        };

        mediaRecorder.onerror = (error) => {
          for (const track of stream.getTracks()) track.stop();
          URL.revokeObjectURL(objectUrl);
          reject(new Error(`Recording failed: ${error}`));
        };

        // Start recording and play media
        mediaRecorder.start();
        mediaElement.currentTime = 0;

        const playPromise = mediaElement.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            for (const track of stream.getTracks()) track.stop();
            URL.revokeObjectURL(objectUrl);
            reject(new Error(`Playback failed: ${error}`));
          });
        }

        // Stop recording after 30 seconds
        setTimeout(() => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
          mediaElement.pause();
        }, 30000);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    });

    mediaElement.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load media file"));
    });
  });
}

/**
 * Validates media duration and returns duration in seconds
 * Throws error if duration exceeds 30 seconds
 */
export async function validateMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const isVideo = file.type.startsWith("video/");
    const element = isVideo ? document.createElement("video") : new Audio();
    element.src = URL.createObjectURL(file);
    element.addEventListener("loadedmetadata", () => {
      const duration = Math.floor(element.duration);
      URL.revokeObjectURL(element.src);
      if (duration > 30) {
        reject(new Error("Preview media must be 30 seconds or less"));
      } else {
        resolve(duration);
      }
    });
    element.addEventListener("error", () => {
      URL.revokeObjectURL(element.src);
      reject(new Error("Failed to load media file"));
    });
  });
}

/**
 * Gets the actual duration of a media file
 */
export async function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");

    if (!isVideo && !isAudio) {
      reject(new Error("File must be audio or video"));
      return;
    }

    const element = isVideo ? document.createElement("video") : new Audio();
    element.src = URL.createObjectURL(file);
    element.addEventListener("loadedmetadata", () => {
      const duration = Math.floor(element.duration);
      URL.revokeObjectURL(element.src);
      resolve(duration);
    });
    element.addEventListener("error", () => {
      URL.revokeObjectURL(element.src);
      reject(new Error("Failed to load media file"));
    });
  });
}
