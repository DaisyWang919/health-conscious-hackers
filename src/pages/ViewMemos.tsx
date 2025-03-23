import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Play, Pause, Save, ArrowLeft, Calendar, X } from 'lucide-react';
import { useMemos } from '../hooks/useMemos';
import toast from 'react-hot-toast';
import { getLocalDateString, createDateWithLocalDateAndTime } from '../utils/dateUtils';

function ViewMemos() {
  const { memos, deleteMemo, updateMemo } = useMemos();
  const navigate = useNavigate();
  const [editingMemo, setEditingMemo] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [audioFormats, setAudioFormats] = useState<Record<string, string>>({});
  const [supportedFormats, setSupportedFormats] = useState<Record<string, boolean>>({});
  
  // Use refs to store audio URLs to avoid recreating them on each render
  const audioUrlsRef = useRef<Map<string, string>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  // Clean up audio URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all object URLs to prevent memory leaks
      audioUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);
  
  // Get supported audio formats
  useEffect(() => {
    const audio = document.createElement('audio');
    const formats: Record<string, boolean> = {
      'audio/webm': !!audio.canPlayType('audio/webm'),
      'audio/webm;codecs=opus': !!audio.canPlayType('audio/webm;codecs=opus'),
      'audio/ogg': !!audio.canPlayType('audio/ogg'),
      'audio/ogg;codecs=opus': !!audio.canPlayType('audio/ogg;codecs=opus'),
      'audio/mp4': !!audio.canPlayType('audio/mp4'),
      'audio/mpeg': !!audio.canPlayType('audio/mpeg'),
      'audio/wav': !!audio.canPlayType('audio/wav')
    };
    
    console.log('Browser audio format support:', formats);
    setSupportedFormats(formats);
  }, []);
  
  // Create audio URLs when memos change and collect format information
  useEffect(() => {
    const formats: Record<string, string> = {};
    
    // For each memo with audio, create object URL if we don't have one yet
    memos.forEach(memo => {
      if (memo.audioBlob) {
        formats[memo.id] = memo.audioBlob.type || memo.audioMimeType || 'audio/webm';
        
        if (!audioUrlsRef.current.has(memo.id)) {
          try {
            // Validate that we have a usable blob before creating a URL
            if (memo.audioBlob instanceof Blob && memo.audioBlob.size > 0) {
              // Make sure the blob has the correct MIME type
              let blobToUse = memo.audioBlob;
              if (memo.audioMimeType && memo.audioBlob.type !== memo.audioMimeType) {
                blobToUse = new Blob([memo.audioBlob], { type: memo.audioMimeType });
              }
              
              const url = URL.createObjectURL(blobToUse);
              audioUrlsRef.current.set(memo.id, url);
            }
          } catch (error) {
            console.error(`Failed to create URL for memo ${memo.id}:`, error);
          }
        }
      }
    });
    
    setAudioFormats(formats);
  }, [memos]);
  
  const handleEdit = (id: string, transcript: string, date: string) => {
    setEditingMemo(id);
    setEditText(transcript);
    setEditDate(getLocalDateString(date));
  };
  
  const cancelEdit = () => {
    setEditingMemo(null);
    setEditText('');
    setEditDate('');
  };
  
  const saveEdit = async (id: string) => {
    try {
      // Update date with time from original memo to maintain time portion
      const originalMemo = memos.find(memo => memo.id === id);
      let updatedDate = editDate;
      
      if (originalMemo) {
        const originalDateTime = new Date(originalMemo.date);
        const newDate = createDateWithLocalDateAndTime(editDate, originalDateTime);
        updatedDate = newDate.toISOString();
      }
      
      await updateMemo(id, { 
        transcript: editText,
        date: updatedDate
      });
      
      setEditingMemo(null);
      toast.success('Memo updated successfully');
    } catch (error) {
      toast.error('Failed to update memo');
    }
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this memo?')) {
      try {
        // Stop playing if this is the currently playing audio
        if (audioPlaying === id) {
          const audio = audioElementsRef.current.get(id);
          if (audio) {
            audio.pause();
          }
          setAudioPlaying(null);
        }
        
        // Clean up object URL before deleting
        if (audioUrlsRef.current.has(id)) {
          URL.revokeObjectURL(audioUrlsRef.current.get(id)!);
          audioUrlsRef.current.delete(id);
        }
        
        // Remove audio element reference
        audioElementsRef.current.delete(id);
        
        await deleteMemo(id);
        toast.success('Memo deleted successfully');
      } catch (error) {
        toast.error('Failed to delete memo');
      }
    }
  };
  
  // Generate an ordered list of MIME types to try, based on browser support
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
    memo: any, 
    mimeType: string, 
    tryIndex: number = 0
  ): Promise<boolean> => {
    try {
      console.log(`Trying to play with MIME type ${mimeType} (attempt ${tryIndex + 1})`);
      
      // Create a blob with the specific MIME type
      const audioBlob = new Blob([memo.audioBlob], { type: mimeType });
      const url = URL.createObjectURL(audioBlob);
      
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
          audioUrlsRef.current.set(memo.id, url);
          audioElementsRef.current.set(memo.id, audio);
          
          // Set up handlers for playback end
          audio.onended = () => {
            setAudioPlaying(null);
          };
          
          // Play the audio
          audio.play()
            .then(() => {
              setAudioPlaying(memo.id);
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
  
  const toggleAudio = async (id: string) => {
    try {
      // Get the memo
      const memo = memos.find(m => m.id === id);
      if (!memo || !memo.audioBlob) {
        return;
      }
      
      // If this audio is already playing, stop it
      if (audioPlaying === id) {
        const audio = audioElementsRef.current.get(id);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        setAudioPlaying(null);
        return;
      }
      
      // Stop any currently playing audio
      if (audioPlaying) {
        const prevAudio = audioElementsRef.current.get(audioPlaying);
        if (prevAudio) {
          prevAudio.pause();
          prevAudio.currentTime = 0;
        }
        setAudioPlaying(null);
      }
      
      // Get the current MIME type
      const currentMimeType = memo.audioMimeType || memo.audioBlob.type || 'audio/webm';
      
      // Get an ordered list of MIME types to try
      const mimeTypesToTry = getOrderedMimeTypesToTry(currentMimeType);
      
      // Try playing with each MIME type in sequence until one works
      let success = false;
      let lastError = null;
      
      for (let i = 0; i < mimeTypesToTry.length; i++) {
        try {
          success = await tryPlayWithMimeType(memo, mimeTypesToTry[i], i);
          if (success) {
            // If a format works, quit the loop
            break;
          }
        } catch (error) {
          lastError = error;
          // Continue to the next format
        }
      }
      
      if (!success) {
        console.error('All playback attempts failed:', lastError);
        // Only show an error to the user if all formats fail
        toast.error('Could not play audio - no supported format found', {
          duration: 3000,
          position: 'bottom-center',
          // Hide the error toast more quickly to minimize disruption
          style: { background: '#fee2e2', color: '#b91c1c' }
        });
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      toast.error('Failed to play audio');
    }
  };
  
  // Group memos by date for better organization
  const groupMemosByDate = () => {
    const groups: {[key: string]: typeof memos} = {};
    
    memos.forEach(memo => {
      const localDateKey = getLocalDateString(memo.date);
      
      if (!groups[localDateKey]) {
        groups[localDateKey] = [];
      }
      groups[localDateKey].push(memo);
    });
    
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, memos]) => ({
        date,
        memos: memos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }));
  };
  
  const groupedMemos = groupMemosByDate();
  
  // Format date for display in a timezone-safe way
  const formatGroupDate = (dateString: string) => {
    // Parse the date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    // Create a date object using local components
    const date = new Date(year, month - 1, day); // month is 0-indexed in JS
    
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-1" />
        Back
      </button>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Voice Memos</h1>
      <p className="text-gray-600 mb-6">
        {memos.length > 0 
          ? `You have ${memos.length} saved memo${memos.length !== 1 ? 's' : ''}`
          : "You haven't recorded any memos yet"}
      </p>
      
      {memos.length > 0 ? (
        <div className="space-y-6">
          {groupedMemos.map(group => (
            <div key={group.date}>
              <div className="flex items-center mb-2">
                <Calendar size={16} className="text-blue-500 mr-2" />
                <h2 className="text-sm font-medium text-gray-700">
                  {formatGroupDate(group.date)}
                </h2>
              </div>
              
              <div className="space-y-3">
                {group.memos.map(memo => (
                  <div 
                    key={memo.id} 
                    className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                  >
                    {editingMemo === memo.id ? (
                      // Editing mode
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-gray-800">Edit Memo</h3>
                          <button 
                            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                            onClick={cancelEdit}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-sm text-gray-600 mb-1">Date</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <label className="block text-sm text-gray-600 mb-1">Transcript</label>
                        <textarea
                          className="w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          autoFocus
                        />
                        
                        <div className="flex justify-end mt-4">
                          <button
                            className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                            onClick={() => saveEdit(memo.id)}
                          >
                            <Save size={16} className="mr-1.5" />
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div>
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleEdit(memo.id, memo.transcript, memo.date)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm text-gray-500 mb-1">
                                {new Date(memo.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                {memo.audioMimeType && (
                                  <span className="text-xs text-gray-400 ml-2">
                                    {memo.audioMimeType.split('/')[1]}
                                  </span>
                                )}
                              </p>
                              <p className="text-gray-800">
                                {memo.transcript}
                              </p>
                            </div>
                            
                            <div className="flex items-center ml-4">
                              {memo.audioBlob && (
                                <button 
                                  className={`p-2 rounded-full mr-1.5 ${
                                    audioPlaying === memo.id 
                                      ? 'bg-blue-100 text-blue-600' 
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAudio(memo.id);
                                  }}
                                >
                                  {audioPlaying === memo.id ? (
                                    <Pause size={16} />
                                  ) : (
                                    <Play size={16} />
                                  )}
                                </button>
                              )}
                              
                              <button
                                className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(memo.id);
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">You haven't recorded any voice memos yet.</p>
          <button 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            onClick={() => navigate('/record')}
          >
            Record Your First Memo
          </button>
        </div>
      )}
    </div>
  );
}

export default ViewMemos;