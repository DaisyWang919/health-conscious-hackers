import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Save, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMemos } from '../hooks/useMemos';
import { transcribeAudio } from '../utils/openai';

const RecordMemo = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState('audio/webm');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const navigate = useNavigate();
  const { addMemo } = useMemos();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Test audio playback compatibility
  useEffect(() => {
    // Check which audio formats are supported
    const audio = document.createElement('audio');
    const supportedFormats = {
      webm: !!audio.canPlayType('audio/webm'),
      webmOpus: !!audio.canPlayType('audio/webm;codecs=opus'),
      ogg: !!audio.canPlayType('audio/ogg'),
      oggOpus: !!audio.canPlayType('audio/ogg;codecs=opus'),
      mp4: !!audio.canPlayType('audio/mp4'),
      mpeg: !!audio.canPlayType('audio/mpeg'),
      wav: !!audio.canPlayType('audio/wav')
    };
    
    console.log('Browser audio support:', supportedFormats);
  }, []);

  const handleStartRecording = async () => {
    try {
      // Reset state
      audioChunksRef.current = [];
      setTranscript('');
      setAudioUrl(null);
      setTranscriptionError(null);
      
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create a prioritized list of MIME types to try
      const mimeTypesToTry = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        'audio/mpeg',
        'audio/wav'
      ];
      
      // Find the first supported MIME type
      let selectedMimeType = '';
      for (const mimeType of mimeTypesToTry) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      // If no supported type is found, default to audio/webm
      if (!selectedMimeType) {
        selectedMimeType = 'audio/webm';
        console.warn('No supported MIME types found, defaulting to audio/webm');
      }
      
      // Save the selected MIME type for later use
      setAudioMimeType(selectedMimeType);
      console.log('Using MIME type for recording:', selectedMimeType);
      
      // Create MediaRecorder with the supported MIME type
      mediaRecorderRef.current = new MediaRecorder(stream, { 
        mimeType: selectedMimeType 
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        try {
          // Create a blob with the correct MIME type
          const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
          audioBlobRef.current = audioBlob;
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          // Check if the audio is playable
          const audio = new Audio();
          audio.src = url;
          
          audio.onloadedmetadata = () => {
            console.log('Audio metadata loaded successfully');
          };
          
          audio.onerror = (e) => {
            console.error('Error loading audio:', e);
          };
          
          // Start transcription
          setIsTranscribing(true);
          try {
            // Check if OpenAI API key is set
            if (!import.meta.env.VITE_OPENAI_API_KEY || 
                import.meta.env.VITE_OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
              // If no API key, use placeholder text
              setTimeout(() => {
                setTranscript("I've been experiencing some mild headaches in the morning " +
                  "and occasional dizziness when standing up too quickly. My blood pressure " +
                  "readings have been a bit higher than usual, around 135/85.");
                setIsTranscribing(false);
              }, 1000);
              
              toast.warning('Using placeholder transcription. Add your OpenAI API key in .env.local for actual transcription.');
            } else {
              // Actual API call to OpenAI Whisper
              const transcribedText = await transcribeAudio(audioBlob);
              setTranscript(transcribedText);
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
          } finally {
            setIsTranscribing(false);
          }
        } catch (error) {
          console.error('Error processing recorded audio:', error);
          toast.error('Failed to process the recorded audio');
        }
      };
      
      // Start recording with a short time slice to get data frequently
      mediaRecorderRef.current.start(100); 
      setIsRecording(true);
      
      // Set up timer to track recording duration
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Get all tracks from the stream and stop them
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSave = async () => {
    if (!transcript || !audioBlobRef.current) {
      toast.error('Nothing to save. Please record a memo first.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Save memo to IndexedDB with the correct MIME type
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
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Test audio playback of the recording
  const testPlayback = () => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audio.play().catch(err => {
      console.error('Playback test failed:', err);
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-1" />
        Back
      </button>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Record Health Memo</h1>
      
      <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-md">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-32 h-32 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center mb-4">
            {isRecording ? (
              <div 
                className="w-16 h-16 bg-red-500 rounded-lg cursor-pointer flex items-center justify-center"
                onClick={handleStopRecording}
              >
                <Square size={24} className="text-white" />
              </div>
            ) : (
              <div 
                className={`w-20 h-20 ${isTranscribing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'} transition-colors rounded-full flex items-center justify-center`}
                onClick={isTranscribing ? undefined : handleStartRecording}
              >
                <Mic size={32} className="text-white" />
              </div>
            )}
          </div>
          
          {isRecording ? (
            <div className="text-center">
              <p className="text-xl font-semibold text-red-500">{formatTime(recordingTime)}</p>
              <p className="text-gray-500">Recording... (Format: {audioMimeType.split('/')[1]})</p>
            </div>
          ) : audioUrl ? (
            <div className="text-center">
              <p className="text-gray-700 font-medium">Recording complete</p>
              <audio className="mt-4" controls src={audioUrl} />
              <p className="text-xs text-gray-500 mt-1">Format: {audioMimeType.split('/')[1]}</p>
            </div>
          ) : (
            <p className="text-gray-600">
              {isTranscribing ? 'Processing audio...' : 'Tap to start recording'}
            </p>
          )}
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Transcript</h3>
          {isTranscribing ? (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-32 flex flex-col items-center justify-center">
              <Loader2 size={24} className="animate-spin text-blue-500 mb-2" />
              <p className="text-gray-500">Transcribing your audio...</p>
            </div>
          ) : transcript ? (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-32">
              <p className="text-gray-800">{transcript}</p>
            </div>
          ) : transcriptionError ? (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50 min-h-32">
              <p className="text-red-600">{transcriptionError}</p>
              <p className="text-gray-600 mt-2 text-sm">
                Please check your OpenAI API key in the .env.local file.
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-32 flex items-center justify-center">
              <p className="text-gray-400 italic">
                {isRecording 
                  ? "Recording in progress..." 
                  : "Record a voice memo to see the transcript"}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!transcript || isSaving || isTranscribing}
            className={`flex items-center px-6 py-2 rounded-lg ${
              !transcript || isSaving || isTranscribing
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                Save Memo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordMemo;