import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

interface UseRecorderOptions {
  onDataAvailable?: (data: Blob) => void;
  onStop?: () => void;
}

export function useRecorder({ onDataAvailable, onStop }: UseRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingVolume, setRecordingVolume] = useState<number[]>([]);
  const [audioMimeType, setAudioMimeType] = useState('audio/webm');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const volumeMonitorRef = useRef<number | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (volumeMonitorRef.current) {
        window.clearInterval(volumeMonitorRef.current);
      }
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setRecordingVolume([]);
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Set up audio visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioAnalyserRef.current = analyser;

      // Monitor volume levels
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      volumeMonitorRef.current = window.setInterval(() => {
        if (analyser) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          const normalizedVolume = Math.min(100, Math.max(0, average * 1.5));
          
          setRecordingVolume(prev => {
            const newVolumes = [...prev, normalizedVolume];
            return newVolumes.length > 50 ? newVolumes.slice(-50) : newVolumes;
          });
        }
      }, 100);

      // Select MIME type
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        'audio/mpeg',
        'audio/wav'
      ];

      const selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
      setAudioMimeType(selectedMimeType);

      // Create recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
        onDataAvailable?.(audioBlob);
        onStop?.();
      };

      // Start recording
      mediaRecorderRef.current.start(250);
      setIsRecording(true);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (volumeMonitorRef.current) {
        window.clearInterval(volumeMonitorRef.current);
        volumeMonitorRef.current = null;
      }
      
      setIsRecording(false);
    }
  };

  return {
    isRecording,
    recordingTime,
    recordingVolume,
    audioMimeType,
    startRecording,
    stopRecording
  };
}