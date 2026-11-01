let globalStream: MediaStream | null = null;

export async function getMicrophoneStream(): Promise<MediaStream> {
  if (!globalStream) {
    globalStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }
  return globalStream;
}
