import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Play, Pause, Edit, X, Check, ArrowLeft, Calendar, Search, Filter, Check as CheckIcon, Volume2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemos } from '../hooks/useMemos';
import toast from 'react-hot-toast';
import { getLocalDateString, createDateWithLocalDateAndTime } from '../utils/dateUtils';
import { Button } from '../components/ui/Button';
import { Memo } from '../utils/db';

function ViewMemos() {
  const { memos, deleteMemo, updateMemo } = useMemos();
  const navigate = useNavigate();
  const [editingMemo, setEditingMemo] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [filterPeriod, setFilterPeriod] = useState<'all' | '7days' | '30days' | 'today'>('all');
  const [selectedMemos, setSelectedMemos] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  
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
  
  // Create audio URLs when memos change
  useEffect(() => {
    // For each memo with audio, create object URL if we don't have one yet
    memos.forEach(memo => {
      if (memo.audioBlob) {
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
  }, [memos]);
  
  // When date groups change, set them all to expanded by default
  useEffect(() => {
    const groups = groupMemosByDate();
    const newExpandedGroups: Record<string, boolean> = {};
    
    groups.forEach(group => {
      // Preserve existing expanded state or default to true
      newExpandedGroups[group.date] = expandedGroups[group.date] !== undefined 
        ? expandedGroups[group.date] 
        : true;
    });
    
    setExpandedGroups(newExpandedGroups);
  }, [memos]);
  
  const handleStartEdit = (id: string, transcript: string, date: string) => {
    setEditingMemo(id);
    setEditText(transcript);
    setEditDate(getLocalDateString(date));
  };
  
  const handleCancelEdit = () => {
    setEditingMemo(null);
    setEditText('');
    setEditDate('');
  };
  
  const handleSaveEdit = async (id: string) => {
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
  
  const handleDeleteSelected = async () => {
    if (selectedMemos.length === 0) {
      toast.error('No memos selected');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedMemos.length} selected memos?`)) {
      try {
        // Process deletions sequentially to avoid potential race conditions
        for (const id of selectedMemos) {
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
        }
        
        toast.success(`${selectedMemos.length} memos deleted successfully`);
        setSelectedMemos([]);
        setIsSelectMode(false);
      } catch (error) {
        toast.error('Failed to delete selected memos');
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
    mimeType: string
  ): Promise<boolean> => {
    try {
      // Create a blob with the specific MIME type
      const audioBlob = new Blob([memo.audioBlob], { type: mimeType });
      const url = URL.createObjectURL(audioBlob);
      
      // Create an audio element and set it up
      const audio = new Audio();
      audio.src = url;
      
      // Return a promise that resolves when the audio starts playing
      // or rejects if there's an error
      return new Promise((resolve, reject) => {
        // Set up error handling
        audio.onerror = (e) => {
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
          success = await tryPlayWithMimeType(memo, mimeTypesToTry[i]);
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
        toast.error('Could not play audio', {
          duration: 2000,
          position: 'bottom-center',
        });
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      toast.error('Failed to play audio');
    }
  };
  
  const toggleSelectMemo = (id: string) => {
    if (selectedMemos.includes(id)) {
      setSelectedMemos(selectedMemos.filter(memoId => memoId !== id));
    } else {
      setSelectedMemos([...selectedMemos, id]);
    }
  };
  
  const toggleSelectAll = () => {
    if (selectedMemos.length === filteredMemos.length) {
      // If all are selected, unselect all
      setSelectedMemos([]);
    } else {
      // Otherwise, select all
      setSelectedMemos(filteredMemos.map(memo => memo.id));
    }
  };
  
  // Toggle group expansion
  const toggleGroupExpansion = (date: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
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
  
  // Apply search and filter to memos
  const applyFilters = (memo: Memo) => {
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      memo.transcript.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply date filter
    let matchesDateFilter = true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const memoDate = new Date(memo.date);
    
    if (filterPeriod === 'today') {
      const startOfDay = new Date(today);
      matchesDateFilter = memoDate >= startOfDay;
    } else if (filterPeriod === '7days') {
      const last7days = new Date(today);
      last7days.setDate(last7days.getDate() - 7);
      matchesDateFilter = memoDate >= last7days;
    } else if (filterPeriod === '30days') {
      const last30days = new Date(today);
      last30days.setDate(last30days.getDate() - 30);
      matchesDateFilter = memoDate >= last30days;
    }
    
    return matchesSearch && matchesDateFilter;
  };
  
  // Apply all active filters
  const filteredMemos = memos.filter(applyFilters);
  
  // Group the filtered memos by date
  const groupedFilteredMemos = (() => {
    const groups: {[key: string]: typeof memos} = {};
    
    filteredMemos.forEach(memo => {
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
  })();
  
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
  
  // Format time nicely
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  // Check if a date is today
  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return today.getDate() === date.getDate() && 
           today.getMonth() === date.getMonth() && 
           today.getFullYear() === date.getFullYear();
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-1.5" />
        Back
      </button>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Voice Memos</h1>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          {memos.length > 0 
            ? `You have ${memos.length} saved memo${memos.length !== 1 ? 's' : ''}`
            : "You haven't recorded any memos yet"}
        </p>
        
        <div className="flex space-x-2">
          {memos.length > 0 && (
            <>
              <Button
                variant="secondary"
                color="blue"
                onClick={() => setIsSelectMode(!isSelectMode)}
                className="text-sm"
              >
                {isSelectMode ? 'Cancel Selection' : 'Select Memos'}
              </Button>
              
              {isSelectMode && selectedMemos.length > 0 && (
                <Button
                  variant="outline"
                  color="gray"
                  onClick={handleDeleteSelected}
                  className="text-sm text-red-600 hover:bg-red-50"
                >
                  Delete Selected ({selectedMemos.length})
                </Button>
              )}
            </>
          )}
          
          <Button
            variant="primary"
            color="blue"
            onClick={() => navigate('/record')}
            className="text-sm"
          >
            Record New
          </Button>
        </div>
      </div>
      
      {/* Search and filters */}
      {memos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search memos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-2">
              <div className="relative">
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value as any)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              
              {isSelectMode && (
                <Button
                  variant="secondary"
                  color="gray"
                  onClick={toggleSelectAll}
                  className="text-sm"
                >
                  {selectedMemos.length === filteredMemos.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              )}
            </div>
          </div>
          
          {/* Filter status */}
          {(searchTerm || filterPeriod !== 'all') && (
            <div className="mt-3 text-sm text-gray-500 flex items-center">
              <Info size={14} className="mr-1.5" />
              <span>
                Showing {filteredMemos.length} of {memos.length} memos
                {searchTerm && <span> matching "{searchTerm}"</span>}
                {filterPeriod !== 'all' && (
                  <span>
                    {' '}
                    from {filterPeriod === 'today' ? 'today' 
                        : filterPeriod === '7days' ? 'the last 7 days' 
                        : 'the last 30 days'}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
      
      {memos.length > 0 ? (
        <div className="space-y-6">
          {filteredMemos.length > 0 ? (
            groupedFilteredMemos.map(group => (
              <div key={group.date} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div 
                  className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleGroupExpansion(group.date)}
                >
                  <div className="flex items-center">
                    <Calendar size={16} className="text-blue-500 mr-2" />
                    <h2 className="font-medium text-gray-700">
                      {formatGroupDate(group.date)}
                      {isToday(group.date) && (
                        <span className="ml-2 text-xs py-0.5 px-1.5 bg-green-100 text-green-700 rounded-full">Today</span>
                      )}
                    </h2>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{group.memos.length} memo{group.memos.length !== 1 ? 's' : ''}</span>
                    {expandedGroups[group.date] ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </div>
                
                {expandedGroups[group.date] && (
                  <div className="divide-y divide-gray-100">
                    {group.memos.map(memo => (
                      <div 
                        key={memo.id} 
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        {editingMemo === memo.id ? (
                          // Editing mode
                          <div className="p-1">
                            <textarea
                              className="w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                              rows={4}
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              autoFocus
                            />
                            
                            <div className="flex items-center justify-between">
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="border border-gray-300 rounded-md p-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  aria-label="Cancel edit"
                                >
                                  <X size={18} />
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(memo.id)}
                                  className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                                  aria-label="Save changes"
                                >
                                  <Check size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex items-start">
                            {isSelectMode && (
                              <div 
                                className="mr-3 mt-2 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelectMemo(memo.id);
                                }}
                              >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer ${
                                  selectedMemos.includes(memo.id) 
                                    ? 'bg-blue-500 border-blue-500' 
                                    : 'border-gray-300 hover:border-blue-400'
                                }`}>
                                  {selectedMemos.includes(memo.id) && (
                                    <CheckIcon size={14} className="text-white" />
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm text-gray-500 mb-1.5 flex items-center">
                                    {formatTime(memo.date)}
                                    {memo.audioBlob && (
                                      <span className="ml-2 flex items-center text-blue-500">
                                        <Volume2 size={13} className="mr-1" />
                                        <span className="text-xs">Audio available</span>
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-gray-800 whitespace-pre-wrap">{memo.transcript}</p>
                                </div>
                                
                                <div className="flex items-center ml-2 pt-1">
                                  {memo.audioBlob && (
                                    <button 
                                      className={`p-2 rounded-full mr-1 ${
                                        audioPlaying === memo.id 
                                          ? 'bg-blue-100 text-blue-600' 
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                      onClick={() => toggleAudio(memo.id)}
                                      aria-label={audioPlaying === memo.id ? "Pause" : "Play"}
                                    >
                                      {audioPlaying === memo.id ? (
                                        <Pause size={16} />
                                      ) : (
                                        <Play size={16} />
                                      )}
                                    </button>
                                  )}
                                  
                                  <button
                                    className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 mr-1"
                                    onClick={() => handleStartEdit(memo.id, memo.transcript, memo.date)}
                                    aria-label="Edit memo"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  
                                  <button
                                    className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600"
                                    onClick={() => handleDelete(memo.id)}
                                    aria-label="Delete memo"
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
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-2">No memos match your search criteria.</p>
              <button 
                className="text-blue-500 hover:text-blue-700"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPeriod('all');
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
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