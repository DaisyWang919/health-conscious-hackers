import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit, Play, ChevronDown, ChevronUp, ArrowLeft, FileText, Stethoscope, Sparkles } from 'lucide-react';
import { useMemos } from '../hooks/useMemos';
import toast from 'react-hot-toast';

function ViewMemos() {
  const { memos, deleteMemo, updateMemo } = useMemos();
  const navigate = useNavigate();
  const [expandedMemo, setExpandedMemo] = useState<string | null>(null);
  const [editingMemo, setEditingMemo] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  
  const toggleExpand = (id: string) => {
    if (expandedMemo === id) {
      setExpandedMemo(null);
    } else {
      setExpandedMemo(id);
    }
  };
  
  const handleEdit = (id: string, transcript: string) => {
    setEditingMemo(id);
    setEditText(transcript);
  };
  
  const saveEdit = async (id: string) => {
    try {
      await updateMemo(id, { transcript: editText });
      setEditingMemo(null);
      toast.success('Memo updated successfully');
    } catch (error) {
      toast.error('Failed to update memo');
    }
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this memo?')) {
      try {
        await deleteMemo(id);
        toast.success('Memo deleted successfully');
      } catch (error) {
        toast.error('Failed to delete memo');
      }
    }
  };
  
  const playAudio = (id: string, audioBlob: Blob) => {
    // Stop any currently playing audio
    if (audioPlaying) {
      const prevAudio = document.getElementById(`audio-${audioPlaying}`) as HTMLAudioElement;
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }
    
    // Play the selected audio
    const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
    if (audio) {
      audio.play();
      setAudioPlaying(id);
      
      // Reset when audio finishes playing
      audio.onended = () => setAudioPlaying(null);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
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
        <div className="space-y-4">
          {memos.map(memo => (
            <div 
              key={memo.id} 
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => toggleExpand(memo.id)}>
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-500 mr-4">
                      {new Date(memo.date).toLocaleDateString()} 
                      <span className="ml-2 text-xs text-gray-400">
                        {new Date(memo.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </p>
                    {memo.audioBlob && (
                      <button 
                        className="p-1.5 bg-gray-100 rounded-full mr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio(memo.id, memo.audioBlob);
                        }}
                      >
                        <Play size={14} className="text-gray-700" />
                      </button>
                    )}
                    <audio id={`audio-${memo.id}`} src={memo.audioBlob ? URL.createObjectURL(memo.audioBlob) : ''} />
                  </div>
                  <p className="text-gray-800 font-medium mt-1 line-clamp-1">
                    {memo.transcript}
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    className="p-1.5 text-gray-500 hover:text-blue-500 mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(memo.id, memo.transcript);
                    }}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="p-1.5 text-gray-500 hover:text-red-500 mr-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(memo.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                  {expandedMemo === memo.id ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </div>
              
              {expandedMemo === memo.id && (
                <div className="p-4 pt-0 border-t border-gray-100">
                  {editingMemo === memo.id ? (
                    <div>
                      <textarea
                        className="w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div className="flex justify-end mt-3 space-x-3">
                        <button
                          className="px-3 py-1.5 text-gray-600 text-sm"
                          onClick={() => setEditingMemo(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                          onClick={() => saveEdit(memo.id)}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-800">{memo.transcript}</p>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                        <button 
                          className="flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50"
                          onClick={() => navigate('/patient-reports', { state: { selectedMemos: [memo.id] } })}
                        >
                          <FileText size={14} className="mr-1" />
                          Patient Report
                        </button>
                        <button 
                          className="flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50"
                          onClick={() => navigate('/doctor-reports', { state: { selectedMemos: [memo.id] } })}
                        >
                          <Stethoscope size={14} className="mr-1" />
                          Doctor Report
                        </button>
                        <button 
                          className="flex items-center px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-sm hover:bg-indigo-100"
                          onClick={() => navigate('/ai-reports', { state: { selectedMemos: [memo.id] } })}
                        >
                          <Sparkles size={14} className="mr-1" />
                          AI Analysis
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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