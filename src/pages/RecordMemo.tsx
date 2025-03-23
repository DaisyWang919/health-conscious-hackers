import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Save, Loader2, ArrowLeft, Play, Pause, RotateCcw, Volume2, VolumeX, Trash2, CheckCircle, Lightbulb, Heart, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMemos } from '../hooks/useMemos';
import { transcribeAudio } from '../utils/openai';
import RecordingPrompts from '../components/RecordingPrompts';
import AudioWaveform from '../components/AudioWaveform';
import { getRandomPrompts } from '../utils/promptSuggestions';

const RecordMemo = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState('audio/webm');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true); // Changed to true by default
  const [recordingVolume, setRecordingVolume] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStep, setCurrentStep] = useState<'ready' | 'recording' | 'review' | 'saving'>('ready');
  const [hasReadyToSave, setHasReadyToSave] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState<Record<string, boolean>>({});
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const volumeMonitorRef = useRef<number | null>(null);
  
  const navigate = useNavigate();
  const { addMemo } = useMemos();

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Clean up timers and audio resources when component unmounts
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (volumeMonitorRef.current) {
        window.clearInterval(volumeMonitorRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
    };
  }, [audioUrl]);

  // Check browser audio compatibility
  useEffect(() => {
    const audio = document.createElement('audio');
    const formats = {
      'audio/webm': !!audio.canPlayType('audio/webm'),
      'audio/webm;codecs=opus': !!audio.canPlayType('audio/webm;codecs=opus'),
      'audio/ogg': !!audio.canPlayType('audio/ogg'),
      'audio/ogg;codecs=opus': !!audio.canPlayType('audio/ogg;codecs=opus'),
      'audio/mp4': !!audio.canPlayType('audio/mp4'),
      'audio/mpeg': !!audio.canPlayType('audio/mpeg'),
      'audio/wav': !!audio.canPlayType('audio/wav')
    };
    
    console.log('Browser audio support:', formats);
    setSupportedFormats(formats);
  }, []);

  // Load quick suggestions
  useEffect(() => {
    setQuickSuggestions(getRandomPrompts(3));
  }, []);

  // Check if transcript and audio are ready to save
  useEffect(() => {
    if (currentStep === 'review' && transcript && audioBlobRef.current && !isTranscribing) {
      setHasReadyToSave(true);
    } else {
      setHasReadyToSave(false);
    }
  }, [currentStep, transcript, isTranscribing]);

  const handleStartRecording = async () => {
    try {
      // Reset state
      audioChunksRef.current = [];
      setTranscript('');
      setAudioUrl(null);
      setTranscriptionError(null);
      setRecordingVolume([]);
      setCurrentStep('recording');
      setIsPlaying(false);
      
      // Clean up previous audio element
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
        audioElementRef.current = null;
      }
      
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Set up audio processing for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioAnalyserRef.current = analyser;
      
      // Monitor audio levels for visualization
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      volumeMonitorRef.current = window.setInterval(() => {
        if (analyser) {
          analyser.getByteFrequencyData(dataArray);
          // Calculate volume level from frequency data
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          const normalizedVolume = Math.min(100, Math.max(0, average * 1.5)); // Amplify for better visualization
          
          setRecordingVolume(prev => {
            const newVolumes = [...prev, normalizedVolume];
            // Keep last 50 values for visualization
            return newVolumes.length > 50 ? newVolumes.slice(-50) : newVolumes;
          });
        }
      }, 100);
      
      // Select the appropriate MIME type
      const mimeTypesToTry = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        'audio/mpeg',
        'audio/wav'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypesToTry) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      if (!selectedMimeType) {
        selectedMimeType = 'audio/webm';
        console.warn('No supported MIME types found, defaulting to audio/webm');
      }
      
      setAudioMimeType(selectedMimeType);
      
      // Create and configure the MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, { 
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        try {
          if (volumeMonitorRef.current) {
            clearInterval(volumeMonitorRef.current);
            volumeMonitorRef.current = null;
          }
          
          // Create a blob with the correct MIME type
          const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
          audioBlobRef.current = audioBlob;
          
          // Set up the audio URL
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          // Start transcription
          setIsTranscribing(true);
          setCurrentStep('review');
          
          try {
            // Check if OpenAI API key is set
            if (!import.meta.env.VITE_OPENAI_API_KEY || 
                import.meta.env.VITE_OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
              // If no API key, use placeholder text after a short delay
              setTimeout(() => {
                setTranscript("I've been experiencing some mild headaches in the morning " +
                  "and occasional dizziness when standing up too quickly. My blood pressure " +
                  "readings have been a bit higher than usual, around 135/85.");
                setIsTranscribing(false);
              }, 1200);
              
              toast.warning('Using placeholder transcription. Add your OpenAI API key in .env.local for actual transcription.');
            } else {
              // Actual API call to OpenAI Whisper
              const transcribedText = await transcribeAudio(audioBlob);
              setTranscript(transcribedText);
              setIsTranscribing(false);
            }
          } catch (error) {
            console.error('Transcription error:', error);
            if (error instanceof Error) {
              setTranscriptionError(error.message);
              toast.error(error.message);
            } else {
              setTranscriptionError('Failed to transcribe audio');
              toast.error('Failed to transcribe audio');
            }
            setIsTranscribing(false);
          }
        } catch (error) {
          console.error('Error processing recorded audio:', error);
          toast.error('Failed to process the recording');
          setIsTranscribing(false);
          setCurrentStep('ready');
        }
      };
      
      // Start recording with short time slices for more frequent data
      mediaRecorderRef.current.start(250); 
      setIsRecording(true);
      
      // Set up timer to track recording duration
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
      setCurrentStep('ready');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks from the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleCancelRecording = () => {
    // Stop recording if in progress
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    // Clean up audio resources
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }
    
    // Reset state
    setIsRecording(false);
    setRecordingTime(0);
    setAudioUrl(null);
    setTranscript('');
    setTranscriptionError(null);
    audioChunksRef.current = [];
    audioBlobRef.current = null;
    setCurrentStep('ready');
    setIsTranscribing(false);
    setRecordingVolume([]);
    setIsPlaying(false);
  };

  const handleSave = async () => {
    if (!transcript || !audioBlobRef.current) {
      toast.error('Nothing to save. Please record a memo first.');
      return;
    }
    
    setIsSaving(true);
    setCurrentStep('saving');
    
    try {
      // Save memo to database
      await addMemo({
        transcript,
        audioBlob: audioBlobRef.current,
        date: new Date().toISOString(),
        audioMimeType: audioMimeType
      });
      
      toast.success('Voice memo saved successfully!');
      navigate('/memos');
    } catch (error) {
      console.error('Error saving memo:', error);
      toast.error('Failed to save memo. Please try again.');
      setIsSaving(false);
      setCurrentStep('review');
    }
  };

  // Get an ordered list of MIME types to try, based on browser support
  const getOrderedMimeTypesToTry = (currentMimeType: string): string[] => {
    // Start with the current MIME type
    const result = [currentMimeType];
    
    // Add supported types that aren't the current type
    const supportedMimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg',
      'audio/ogg;codecs=opus',
      'audio/mpeg',
      'audio/mp4',
      'audio/wav'
    ];
    
    // First add the types the browser says it supports
    for (const mimeType of supportedMimeTypes) {
      if (mimeType !== currentMimeType && supportedFormats[mimeType]) {
        result.push(mimeType);
      }
    }
    
    // Then add the rest as fallbacks
    for (const mimeType of supportedMimeTypes) {
      if (mimeType !== currentMimeType && !supportedFormats[mimeType] && !result.includes(mimeType)) {
        result.push(mimeType);
      }
    }
    
    return result;
  };
  
  // Try to play audio with a specific MIME type
  const tryPlayWithMimeType = async (
    audioBlob: Blob, 
    mimeType: string, 
    tryIndex: number = 0
  ): Promise<boolean> => {
    try {
      console.log(`Trying to play with MIME type ${mimeType} (attempt ${tryIndex + 1})`);
      
      // Create a blob with the specific MIME type
      const typedBlob = new Blob([audioBlob], { type: mimeType });
      const url = URL.createObjectURL(typedBlob);
      
      // Create an audio element and set it up
      const audio = new Audio();
      audio.src = url;
      
      // Return a promise that resolves when the audio starts playing
      // or rejects if there's an error
      return new Promise((resolve, reject) => {
        // Set up error handling - don't show user-facing errors here
        audio.onerror = (e) => {
          console.error(`Error playing with MIME type ${mimeType}:`, e);
          URL.revokeObjectURL(url);
          reject(new Error(`Failed to play with MIME type ${mimeType}`));
        };
        
        // Set up success handling
        audio.oncanplay = () => {
          // Store the URL and audio element
          audioElementRef.current = audio;
          
          // Set up handlers for playback end
          audio.onended = () => {
            setIsPlaying(false);
          };
          
          // Set up play/pause event handlers
          audio.onplay = () => setIsPlaying(true);
          audio.onpause = () => setIsPlaying(false);
          
          // Play the audio
          audio.play()
            .then(() => {
              resolve(true);
            })
            .catch((error) => {
              console.error(`Play failed for MIME type ${mimeType}:`, error);
              URL.revokeObjectURL(url);
              reject(error);
            });
        };
        
        // Set a timeout to prevent waiting too long
        setTimeout(() => {
          if (!audio.paused) {
            // If playing, it's good
            resolve(true);
          } else {
            // If still not playing after timeout, reject
            URL.revokeObjectURL(url);
            reject(new Error('Playback timeout'));
          }
        }, 2000);
      });
    } catch (error) {
      console.error(`Error setting up audio with MIME type ${mimeType}:`, error);
      return false;
    }
  };

  // Improved toggle playback function
  const togglePlayback = async () => {
    // If currently playing, just pause
    if (isPlaying && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
      return;
    }
    
    // If we have a valid audio element that's just paused, resume it
    if (audioElementRef.current && !audioElementRef.current.ended) {
      try {
        await audioElementRef.current.play();
        setIsPlaying(true);
        return;
      } catch (err) {
        // If resuming fails, try to recreate the audio element
        console.warn('Could not resume playback, will try recreating audio element:', err);
      }
    }
    
    // If we don't have a blob, can't play anything
    if (!audioBlobRef.current) {
      console.error('No audio blob available for playback');
      return;
    }
    
    // Try to play the audio with different MIME types
    const currentMimeType = audioMimeType || 'audio/webm';
    const mimeTypesToTry = getOrderedMimeTypesToTry(currentMimeType);
    
    // Try playing with each MIME type in sequence until one works
    let success = false;
    let lastError = null;
    
    for (let i = 0; i < mimeTypesToTry.length; i++) {
      try {
        success = await tryPlayWithMimeType(audioBlobRef.current, mimeTypesToTry[i], i);
        if (success) {
          setIsPlaying(true);
          break;
        }
      } catch (error) {
        lastError = error;
        // Continue to the next format
      }
    }
    
    if (!success) {
      console.error('All playback attempts failed:', lastError);
      toast.error('Could not play audio - no supported format found', {
        duration: 3000,
        position: 'bottom-center'
      });
    }
  };

  const toggleMute = () => {
    if (!audioElementRef.current) return;
    
    audioElementRef.current.muted = !audioElementRef.current.muted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectPrompt = (prompt: string) => {
    // If we already have some transcript, add a space
    let newTranscript = transcript ? transcript + " " : "";
    
    // Add the prompt
    setTranscript(newTranscript + prompt);
    
    // Focus the textarea if we've completed recording
    if (currentStep === 'review') {
      const textareaElement = document.getElementById('transcript-textarea');
      if (textareaElement) {
        textareaElement.focus();
      }
    }
  };

  const refreshSuggestions = () => {
    setQuickSuggestions(getRandomPrompts(3));
  };

  // Render different UI based on current step
  const renderContent = () => {
    switch (currentStep) {
      case 'ready':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div 
              className="relative w-40 h-40 rounded-full bg-blue-50 border-8 border-blue-100 flex items-center justify-center mb-6 cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={handleStartRecording}
            >
              <div className="absolute inset-0 rounded-full bg-blue-500 bg-opacity-5 animate-pulse"></div>
              <Mic size={48} className="text-blue-500" />
            </div>
            
            <h2 className="text-lg font-medium text-gray-800 mb-2">Record your health memo</h2>
            <p className="text-gray-500 text-center max-w-sm">
              Tap the microphone and speak clearly about your symptoms, medication effects, or health concerns.
            </p>
            
            {/* Quick Suggestion Cards - Always visible */}
            <div className="mt-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600 flex items-center">
                  <Lightbulb size={16} className="mr-1.5 text-blue-500" />
                  Suggestion prompts:
                </p>
                <button 
                  onClick={refreshSuggestions}
                  className="text-xs flex items-center text-gray-500 hover:text-blue-500"
                >
                  <RefreshCw size={12} className="mr-1" />
                  Refresh
                </button>
              </div>
              
              <div className="space-y-2">
                {quickSuggestions.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleStartRecording()}
                    className="w-full text-left p-3 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowPrompts(!showPrompts)}
                className="mt-4 text-sm text-gray-500 hover:text-blue-600 flex items-center mx-auto"
              >
                <Lightbulb size={14} className="mr-1" />
                {showPrompts ? "Hide more suggestions" : "Show more suggestions"}
              </button>
              
              {showPrompts && (
                <div className="mt-3">
                  <RecordingPrompts onSelectPrompt={handleStartRecording} />
                </div>
              )}
            </div>
          </div>
        );
        
      case 'recording':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-full max-w-sm mb-8">
              <div className="h-32 bg-blue-50 rounded-xl border border-blue-100 overflow-hidden p-4 flex items-end justify-center">
                <AudioWaveform values={recordingVolume} />
              </div>
              
              <div className="absolute top-4 left-4 bg-red-100 px-3 py-1 rounded-full flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                <span className="text-red-600 text-sm font-medium">Recording</span>
              </div>
              
              <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-lg">
                <span className="text-gray-800 font-medium">{formatTime(recordingTime)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancelRecording}
                className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Trash2 size={20} />
              </button>
              
              <button
                onClick={handleStopRecording}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <Square size={24} fill="white" className="text-white" />
              </button>
            </div>
            
            <p className="mt-6 text-gray-500 text-center max-w-sm">
              Speak clearly about your health. Tap the square button when you're finished.
            </p>
          </div>
        );
        
      case 'review':
        return (
          <div className="py-4">
            {audioBlobRef.current && (
              <div className="mb-8">
                <h3 className="text-gray-700 font-medium mb-2">Review Recording</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <button
                        onClick={togglePlayback}
                        className={`p-2 rounded-full mr-3 hover:bg-blue-200 transition-colors ${
                          isPlaying ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                      <span className="text-gray-600 text-sm">
                        {formatTime(recordingTime)} recorded
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleMute}
                        className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full"
                      >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                      <button
                        onClick={handleCancelRecording}
                        className="p-1.5 text-gray-500 hover:text-red-500 rounded-full"
                        title="Discard recording"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={handleStartRecording}
                        className="p-1.5 text-gray-500 hover:text-blue-500 rounded-full"
                        title="Record again"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <AudioWaveform values={recordingVolume} isStatic />
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="text-gray-700 font-medium mb-2">
                {isTranscribing ? "Transcribing your memo..." : "Edit Transcript"}
              </h3>
              
              {isTranscribing ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center min-h-[160px]">
                  <Loader2 size={28} className="text-blue-500 animate-spin mb-3" />
                  <p className="text-gray-500">Converting your speech to text...</p>
                </div>
              ) : transcriptionError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 min-h-[160px]">
                  <p className="text-red-600 mb-2">{transcriptionError}</p>
                  <p className="text-gray-600 text-sm">
                    Please check your OpenAI API key in the .env.local file or try recording again.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    id="transcript-textarea"
                    className="w-full border border-gray-200 rounded-lg p-4 min-h-[160px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Your transcript will appear here. You can edit it if needed."
                    rows={6}
                  />
                </div>
              )}
            </div>
            
            {/* Suggestion prompts in review mode */}
            <div className="mt-3 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600 flex items-center">
                  <Lightbulb size={16} className="mr-1.5 text-blue-500" />
                  Add to your notes:
                </p>
                <button 
                  onClick={refreshSuggestions}
                  className="text-xs flex items-center text-gray-500 hover:text-blue-500"
                >
                  <RefreshCw size={12} className="mr-1" />
                  Refresh
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {quickSuggestions.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectPrompt(prompt)}
                    className="text-left p-2.5 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded border border-gray-200 text-sm transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              
              {showPrompts && (
                <div className="mt-3">
                  <RecordingPrompts onSelectPrompt={handleSelectPrompt} />
                </div>
              )}
              
              <button
                onClick={() => setShowPrompts(!showPrompts)}
                className="mt-3 text-sm text-gray-500 hover:text-blue-600 flex items-center mx-auto"
              >
                <Lightbulb size={14} className="mr-1" />
                {showPrompts ? "Hide more suggestions" : "Show more suggestions"}
              </button>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={handleCancelRecording}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSave}
                disabled={!hasReadyToSave}
                className={`flex items-center px-5 py-2 rounded-lg ${
                  hasReadyToSave 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } transition-colors`}
              >
                <Save size={18} className="mr-2" />
                Save Memo
              </button>
            </div>
          </div>
        );
        
      case 'saving':
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              {isSaving ? (
                <Loader2 size={36} className="text-blue-500 animate-spin" />
              ) : (
                <CheckCircle size={36} className="text-green-500" />
              )}
            </div>
            
            <h2 className="text-xl font-medium text-gray-800 mb-2">
              {isSaving ? "Saving your memo..." : "Memo saved!"}
            </h2>
            
            <p className="text-gray-500 text-center">
              {isSaving 
                ? "Just a moment while we save your health information." 
                : "Your health memo has been saved successfully."}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-1" />
        Back
      </button>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        Record Health Memo
        <Heart size={20} className="ml-2 text-pink-500" />
      </h1>
      
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-md">
        {renderContent()}
      </div>
    </div>
  );
};

export default RecordMemo;