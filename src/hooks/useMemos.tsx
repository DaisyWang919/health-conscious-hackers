import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createLocalDatabase } from '../utils/db';

export interface Memo {
  id: string;
  transcript: string;
  audioBlob: Blob;
  date: string;
}

interface MemosContextType {
  memos: Memo[];
  loading: boolean;
  error: string | null;
  addMemo: (memo: Omit<Memo, 'id'>) => Promise<string>;
  updateMemo: (id: string, data: Partial<Omit<Memo, 'id'>>) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  getMemo: (id: string) => Promise<Memo | undefined>;
}

const MemosContext = createContext<MemosContextType | undefined>(undefined);

export const MemosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<any>(null);
  
  // Initialize the database
  useEffect(() => {
    const initDb = async () => {
      try {
        const database = await createLocalDatabase();
        setDb(database);
        
        // Load all memos
        await loadMemos(database);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError('Failed to load memos. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };
    
    initDb();
  }, []);
  
  const loadMemos = async (database: any) => {
    try {
      const allMemos = await database.getAllMemos();
      setMemos(allMemos);
    } catch (err) {
      console.error('Error loading memos:', err);
      setError('Failed to load memos');
    }
  };
  
  const addMemo = async (memo: Omit<Memo, 'id'>): Promise<string> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      const id = await db.addMemo(memo);
      await loadMemos(db);
      return id;
    } catch (err) {
      console.error('Error adding memo:', err);
      throw new Error('Failed to add memo');
    }
  };
  
  const updateMemo = async (id: string, data: Partial<Omit<Memo, 'id'>>): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      await db.updateMemo(id, data);
      await loadMemos(db);
    } catch (err) {
      console.error('Error updating memo:', err);
      throw new Error('Failed to update memo');
    }
  };
  
  const deleteMemo = async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      await db.deleteMemo(id);
      await loadMemos(db);
    } catch (err) {
      console.error('Error deleting memo:', err);
      throw new Error('Failed to delete memo');
    }
  };
  
  const getMemo = async (id: string): Promise<Memo | undefined> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      return await db.getMemo(id);
    } catch (err) {
      console.error('Error getting memo:', err);
      throw new Error('Failed to get memo');
    }
  };
  
  return (
    <MemosContext.Provider value={{
      memos,
      loading,
      error,
      addMemo,
      updateMemo,
      deleteMemo,
      getMemo
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