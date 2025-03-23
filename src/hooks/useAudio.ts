import { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface UseAudioOptions {
  onPlaybackEnd?: () => void;
  onError?: (error: Error) => void;
}

export function useAudio({ onPlaybackEnd, onError }: UseAudioOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  const tryPlayWithMimeType = async (
    audioBlob: Blob,
    mimeType: string
  ): Promise<boolean> => {
    try {
      const typedBlob = new Blob([audioBlob], { type: mimeType });
      const url = URL.createObjectURL(typedBlob);
      
      const audio = new Audio();
      audio.src = url;
      
      return new Promise((resolve, reject) => {
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error(`Failed to play with MIME type ${mimeType}`));
        };
        
        audio.oncanplay = () => {
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
          }
          
          audioUrlRef.current = url;
          audioElementRef.current = audio;
          
          audio.onended = () => {
            setIsPlaying(false);
            onPlaybackEnd?.();
          };
          
          audio.play()
            .then(() => {
              setIsPlaying(true);
              resolve(true);
            })
            .catch(reject);
        };
        
        setTimeout(() => {
          if (!audio.paused) {
            resolve(true);
          } else {
            URL.revokeObjectURL(url);
            reject(new Error('Playback timeout'));
          }
        }, 2000);
      });
    } catch (error) {
      console.error(`Error with MIME type ${mimeType}:`, error);
      return false;
    }
  };

  const play = async (audioBlob: Blob, mimeTypes: string[]) => {
    try {
      // If currently playing, pause first
      if (isPlaying && audioElementRef.current) {
        audioElementRef.current.pause();
        setIsPlaying(false);
        return;
      }

      // Try each MIME type until one works
      let success = false;
      let lastError = null;

      for (const mimeType of mimeTypes) {
        try {
          success = await tryPlayWithMimeType(audioBlob, mimeType);
          if (success) break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!success) {
        throw lastError || new Error('No supported format found');
      }
    } catch (error) {
      console.error('Playback error:', error);
      onError?.(error as Error);
      toast.error('Could not play audio');
    }
  };

  const stop = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (audioElementRef.current) {
      audioElementRef.current.muted = !audioElementRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return {
    isPlaying,
    isMuted,
    play,
    stop,
    toggleMute
  };
}