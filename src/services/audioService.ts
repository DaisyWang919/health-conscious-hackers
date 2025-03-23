// Centralized audio handling service
export class AudioService {
  private static supportedMimeTypes = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav'
  ];

  static getSupportedMimeType(): string {
    return this.supportedMimeTypes.find(type => 
      MediaRecorder.isTypeSupported(type)
    ) || 'audio/webm';
  }

  static async createRecorder(options: MediaRecorderOptions = {}): Promise<MediaRecorder> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    return new MediaRecorder(stream, {
      mimeType: this.getSupportedMimeType(),
      audioBitsPerSecond: 128000,
      ...options
    });
  }

  static async createAnalyser(stream: MediaStream): Promise<AnalyserNode> {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    return analyser;
  }

  static getVolumeLevel(analyser: AnalyserNode): number {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    return Math.min(100, Math.max(0, average * 1.5));
  }

  static async playAudio(blob: Blob, mimeType: string): Promise<HTMLAudioElement> {
    const audio = new Audio();
    const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
    
    return new Promise((resolve, reject) => {
      audio.src = url;
      audio.oncanplay = () => resolve(audio);
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to play audio with type ${mimeType}`));
      };
    });
  }

  static cleanup(audio?: HTMLAudioElement, url?: string) {
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}