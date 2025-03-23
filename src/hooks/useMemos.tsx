import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useDatabase, Memo, MemoWithAudio } from '../utils/db';
import { get, set } from 'idb-keyval';
import { getLocalDateString, getTodayDateString, getYesterdayDateString, isSameLocalDay } from '../utils/dateUtils';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastRecordDate: string | null;
  streakDates: string[];
}

interface MemosContextType {
  memos: MemoWithAudio[];
  loading: boolean;
  error: string | null;
  streakData: StreakData;
  addMemo: (memo: Omit<Memo, 'id'> & { audioBlob: Blob }) => Promise<string>;
  updateMemo: (id: string, data: Partial<Omit<Memo, 'id'> & { audioBlob?: Blob }>) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  getMemo: (id: string) => Promise<MemoWithAudio | null>;
  refreshMemos: () => Promise<void>;
}

const MemosContext = createContext<MemosContextType | undefined>(undefined);

const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastRecordDate: null,
  streakDates: []
};

export const MemosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [memos, setMemos] = useState<MemoWithAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<StreakData>(DEFAULT_STREAK_DATA);
  
  const db = useDatabase();
  
  // Load all memos from the database
  const loadMemos = async () => {
    try {
      const allMemos = await db.getAllMemosWithAudio();
      setMemos(allMemos);
      return allMemos;
    } catch (err) {
      console.error('Error loading memos:', err);
      setError('Failed to load memos');
      return [];
    }
  };
  
  // Initialize the database and load data
  useEffect(() => {
    const initDb = async () => {
      try {
        setLoading(true);
        
        // Load all memos
        const loadedMemos = await loadMemos();
        
        // Load streak data
        const storedStreakData = await get('healthvoice_streak');
        if (storedStreakData) {
          setStreakData(storedStreakData);
        } else {
          // Calculate streak data from memos if we don't have it saved
          updateStreakData(loadedMemos);
        }
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError('Failed to load memos. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };
    
    initDb();
  }, []);
  
  // Calculate and update streak data
  const updateStreakData = async (memosData?: MemoWithAudio[], newMemoDate?: string) => {
    // Use provided memos or current state
    const memosToProcess = memosData || memos;
    
    // If no memos and no new date, nothing to do
    if (memosToProcess.length === 0 && !newMemoDate) return;
    
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    
    // Extract dates from memos
    let memoDates = memosToProcess.map(memo => getLocalDateString(memo.date));
    
    // Add the new memo date if provided and not already in the array
    if (newMemoDate) {
      const newDate = getLocalDateString(newMemoDate);
      if (!memoDates.includes(newDate)) {
        memoDates.push(newDate);
      }
    }
    
    // Create a Set of unique dates and sort them
    const uniqueDates = [...new Set(memoDates)].sort();
    
    // Calculate current streak
    let currentStreak = 0;
    
    if (uniqueDates.includes(today)) {
      currentStreak = 1;
      
      // Count backwards from yesterday
      for (let i = 1; i < 1000; i++) { // Safety limit
        const checkDate = getLocalDateString(new Date(Date.now() - i * 86400000).toISOString());
        if (uniqueDates.includes(checkDate)) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else if (uniqueDates.includes(yesterday)) {
      // Last record was yesterday, streak is still active
      currentStreak = 1;
      
      // Count backwards from 2 days ago
      for (let i = 2; i < 1000; i++) { // Safety limit
        const checkDate = getLocalDateString(new Date(Date.now() - i * 86400000).toISOString());
        if (uniqueDates.includes(checkDate)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    // Calculate longest streak
    let longestStreak = streakData.longestStreak;
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
    
    const newStreakData: StreakData = {
      currentStreak,
      longestStreak,
      lastRecordDate: uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : null,
      streakDates: uniqueDates
    };
    
    setStreakData(newStreakData);
    await set('healthvoice_streak', newStreakData);
    
    return newStreakData;
  };
  
  // Add a new memo
  const addMemo = async (memo: Omit<Memo, 'id'> & { audioBlob: Blob }): Promise<string> => {
    try {
      const id = await db.addMemo(memo);
      
      // Refresh memos after adding
      await loadMemos();
      
      // Update streak with the new memo date
      await updateStreakData(undefined, memo.date);
      
      return id;
    } catch (err) {
      console.error('Error adding memo:', err);
      throw new Error('Failed to add memo');
    }
  };
  
  // Update an existing memo
  const updateMemo = async (id: string, data: Partial<Omit<Memo, 'id'> & { audioBlob?: Blob }>): Promise<void> => {
    try {
      await db.updateMemo(id, data);
      
      // Refresh memos after updating
      await loadMemos();
      
      // Recalculate streak if date was changed
      if (data.date) {
        await updateStreakData();
      }
    } catch (err) {
      console.error('Error updating memo:', err);
      throw new Error('Failed to update memo');
    }
  };
  
  // Delete a memo
  const deleteMemo = async (id: string): Promise<void> => {
    try {
      await db.deleteMemo(id);
      
      // Refresh memos after deletion
      await loadMemos();
      
      // Recalculate streak data after deletion
      await updateStreakData();
    } catch (err) {
      console.error('Error deleting memo:', err);
      throw new Error('Failed to delete memo');
    }
  };
  
  // Get a single memo
  const getMemo = async (id: string): Promise<MemoWithAudio | null> => {
    try {
      return await db.getFullMemo(id);
    } catch (err) {
      console.error('Error getting memo:', err);
      throw new Error('Failed to get memo');
    }
  };
  
  // Function to refresh memos
  const refreshMemos = async (): Promise<void> => {
    try {
      await loadMemos();
    } catch (err) {
      console.error('Error refreshing memos:', err);
    }
  };
  
  return (
    <MemosContext.Provider value={{
      memos,
      loading,
      error,
      streakData,
      addMemo,
      updateMemo,
      deleteMemo,
      getMemo,
      refreshMemos
    }}>
      {children}
    </MemosContext.Provider>
  );
};

export const useMemos = () => {
  const context = useContext(MemosContext);
  if (context === undefined) {
    throw new Error('useMemos must be used within a MemosProvider');
  }
  return context;
};