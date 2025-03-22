// IndexedDB interface for storing memos
export async function createLocalDatabase() {
  const DB_NAME = 'health-voice-db';
  const DB_VERSION = 1;
  const MEMO_STORE = 'memos';
  
  // Open the database
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(new Error('Failed to open database'));
      
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for memos if it doesn't exist
        if (!db.objectStoreNames.contains(MEMO_STORE)) {
          const store = db.createObjectStore(MEMO_STORE, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
        }
      };
    });
  };
  
  // Open the database
  const db = await openDB();
  
  // Add a new memo
  const addMemo = (memo: { transcript: string; audioBlob: Blob; date: string }): Promise<string> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MEMO_STORE], 'readwrite');
      const store = transaction.objectStore(MEMO_STORE);
      
      // Generate a unique ID
      const id = `memo_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const memoWithId = { id, ...memo };
      
      const request = store.add(memoWithId);
      
      request.onerror = () => reject(new Error('Failed to add memo'));
      request.onsuccess = () => resolve(id);
    });
  };
  
  // Get a memo by ID
  const getMemo = (id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MEMO_STORE], 'readonly');
      const store = transaction.objectStore(MEMO_STORE);
      
      const request = store.get(id);
      
      request.onerror = () => reject(new Error('Failed to get memo'));
      request.onsuccess = () => resolve(request.result);
    });
  };
  
  // Get all memos
  const getAllMemos = (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MEMO_STORE], 'readonly');
      const store = transaction.objectStore(MEMO_STORE);
      
      const request = store.getAll();
      
      request.onerror = () => reject(new Error('Failed to get memos'));
      request.onsuccess = () => resolve(request.result);
    });
  };
  
  // Update a memo
  const updateMemo = (id: string, data: Partial<{ transcript: string; audioBlob: Blob; date: string }>): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MEMO_STORE], 'readwrite');
      const store = transaction.objectStore(MEMO_STORE);
      
      // First get the existing memo
      const getRequest = store.get(id);
      
      getRequest.onerror = () => reject(new Error('Failed to get memo for update'));
      
      getRequest.onsuccess = () => {
        const memo = getRequest.result;
        if (!memo) {
          return reject(new Error('Memo not found'));
        }
        
        // Update only the fields that are provided
        const updatedMemo = { ...memo, ...data };
        
        const updateRequest = store.put(updatedMemo);
        
        updateRequest.onerror = () => reject(new Error('Failed to update memo'));
        updateRequest.onsuccess = () => resolve();
      };
    });
  };
  
  // Delete a memo
  const deleteMemo = (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MEMO_STORE], 'readwrite');
      const store = transaction.objectStore(MEMO_STORE);
      
      const request = store.delete(id);
      
      request.onerror = () => reject(new Error('Failed to delete memo'));
      request.onsuccess = () => resolve();
    });
  };
  
  return {
    addMemo,
    getMemo,
    getAllMemos,
    updateMemo,
    deleteMemo
  };
}