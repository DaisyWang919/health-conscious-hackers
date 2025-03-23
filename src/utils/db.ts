import initSqlJs, { Database } from 'sql.js';
import { get, set } from 'idb-keyval';

export interface Memo {
  id: string;
  transcript: string;
  date: string;
  audioMimeType?: string; // Add MIME type tracking
}

export interface MemoWithAudio extends Memo {
  audioBlob: Blob;
}

export interface Report {
  id: string;
  title: string;
  topic: string;
  analysisType: string;
  date: string;
  reportContent: string; // JSON stringified report content
  memoIds: string; // Comma-separated list of memo IDs used in the report
}

// SQLite database class
class SqliteDatabase {
  private db: Database | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Initialize the database when the class is instantiated
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        // Fetch the wasm file
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });

      // Try to load existing database from IndexedDB
      const savedDbData = await get('healthvoice-db');
      
      if (savedDbData) {
        // If we have a saved database, load it
        this.db = new SQL.Database(new Uint8Array(savedDbData));
        
        // Check if we need to add the audioMimeType column
        const hasAudioMimeType = this.db.exec(`
          SELECT COUNT(*) FROM pragma_table_info('memos') WHERE name = 'audioMimeType'
        `);
        
        if (hasAudioMimeType.length === 0 || hasAudioMimeType[0].values[0][0] === 0) {
          // Add the audioMimeType column if it doesn't exist
          this.db.exec(`ALTER TABLE memos ADD COLUMN audioMimeType TEXT`);
          await this.saveDb();
        }
        
        // Check if we need to create the reports table
        const hasReportsTable = this.db.exec(`
          SELECT name FROM sqlite_master WHERE type='table' AND name='reports'
        `);
        
        if (hasReportsTable.length === 0 || hasReportsTable[0].values.length === 0) {
          // Create the reports table if it doesn't exist
          this.db.exec(`
            CREATE TABLE reports (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              topic TEXT NOT NULL,
              analysisType TEXT NOT NULL,
              date TEXT NOT NULL,
              reportContent TEXT NOT NULL,
              memoIds TEXT NOT NULL
            )
          `);
          await this.saveDb();
        }
      } else {
        // Otherwise, create a new database
        this.db = new SQL.Database();
        
        // Create the memos table with audioMimeType column
        this.db.run(`
          CREATE TABLE IF NOT EXISTS memos (
            id TEXT PRIMARY KEY,
            transcript TEXT NOT NULL,
            date TEXT NOT NULL,
            audioMimeType TEXT
          );
        `);
        
        // Create the reports table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            topic TEXT NOT NULL,
            analysisType TEXT NOT NULL,
            date TEXT NOT NULL,
            reportContent TEXT NOT NULL,
            memoIds TEXT NOT NULL
          );
        `);

        // Save the initial database
        await this.saveDb();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw new Error('Database initialization failed');
    }
  }

  // Wait for initialization to complete
  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) await this.initPromise;
  }

  // Save the database to IndexedDB
  private async saveDb(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const data = this.db.export();
    await set('healthvoice-db', data.buffer);
  }

  // Get all memos
  async getAllMemos(): Promise<Memo[]> {
    await this.ensureInitialized();
    
    if (!this.db) throw new Error('Database not initialized');
    
    const result = this.db.exec('SELECT id, transcript, date, audioMimeType FROM memos ORDER BY date DESC');
    
    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }
    
    return result[0].values.map(row => ({
      id: row[0] as string,
      transcript: row[1] as string,
      date: row[2] as string,
      audioMimeType: row[3] as string | undefined
    }));
  }

  // Get a memo by ID
  async getMemo(id: string): Promise<Memo | null> {
    await this.ensureInitialized();
    
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT id, transcript, date, audioMimeType FROM memos WHERE id = :id');
    stmt.bind({ ':id': id });
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return {
        id: row.id as string,
        transcript: row.transcript as string,
        date: row.date as string,
        audioMimeType: row.audioMimeType as string | undefined
      };
    }
    
    stmt.free();
    return null;
  }

  // Add a new memo
  async addMemo(memo: Omit<Memo, 'id'> & { audioBlob: Blob }): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.db) throw new Error('Database not initialized');
    
    const id = `memo_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const audioMimeType = memo.audioBlob.type || 'audio/webm';
    
    // Insert memo into the database
    const stmt = this.db.prepare(`
      INSERT INTO memos (id, transcript, date, audioMimeType)
      VALUES (:id, :transcript, :date, :audioMimeType)
    `);
    
    stmt.run({
      ':id': id,
      ':transcript': memo.transcript,
      ':date': memo.date,
      ':audioMimeType': audioMimeType
    });
    
    stmt.free();
    
    // Store the audio blob safely with its MIME type information
    const audioBlob = new Blob([memo.audioBlob], { type: audioMimeType });
    await set(`audio_${id}`, audioBlob);
    
    // Save the database
    await this.saveDb();
    
    return id;
  }

  // Update a memo
  async updateMemo(id: string, data: Partial<Omit<Memo, 'id'> & { audioBlob?: Blob }>): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.db) throw new Error('Database not initialized');
    
    // Start building the SQL update statement
    let sql = 'UPDATE memos SET ';
    const params: Record<string, any> = { ':id': id };
    const updateParts: string[] = [];
    
    // Build the update statement parts
    if (data.transcript !== undefined) {
      updateParts.push('transcript = :transcript');
      params[':transcript'] = data.transcript;
    }
    
    if (data.date !== undefined) {
      updateParts.push('date = :date');
      params[':date'] = data.date;
    }
    
    // Handle audio MIME type if audio blob is provided
    let audioMimeType: string | undefined;
    if (data.audioBlob) {
      audioMimeType = data.audioBlob.type || 'audio/webm';
      updateParts.push('audioMimeType = :audioMimeType');
      params[':audioMimeType'] = audioMimeType;
    }
    
    // If there's nothing to update in the main table, and no audio blob, exit early
    if (updateParts.length === 0 && !data.audioBlob) {
      return;
    }
    
    // If we have updates for the main table, execute the update
    if (updateParts.length > 0) {
      sql += updateParts.join(', ') + ' WHERE id = :id';
      const stmt = this.db.prepare(sql);
      stmt.run(params);
      stmt.free();
      
      // Save the database
      await this.saveDb();
    }
    
    // If we have an audio blob, update it separately
    if (data.audioBlob) {
      // Store with explicit MIME type
      const audioBlob = new Blob([data.audioBlob], { type: audioMimeType });
      await set(`audio_${id}`, audioBlob);
    }
  }

  // Delete a memo
  async deleteMemo(id: string): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.db) throw new Error('Database not initialized');
    
    // Delete from the database
    const stmt = this.db.prepare('DELETE FROM memos WHERE id = :id');
    stmt.run({ ':id': id });
    stmt.free();
    
    // Delete the associated audio blob
    try {
      // Using IndexedDB to delete the audio blob
      await get(`audio_${id}`).then(
        blob => blob && set(`audio_${id}`, undefined)
      );
    } catch (error) {
      console.error('Failed to delete audio blob:', error);
    }
    
    // Save the database
    await this.saveDb();
  }

  // Get audio blob for a memo
  async getAudioBlob(id: string): Promise<Blob | null> {
    try {
      const memo = await this.getMemo(id);
      const blob = await get(`audio_${id}`);
      
      if (!blob) return null;
      
      // Ensure blob has the correct MIME type
      if (memo && memo.audioMimeType && blob instanceof Blob) {
        // If the blob doesn't already have the correct MIME type
        if (blob.type !== memo.audioMimeType) {
          return new Blob([blob], { type: memo.audioMimeType });
        }
      }
      
      return blob || null;
    } catch (error) {
      console.error('Failed to get audio blob:', error);
      return null;
    }
  }

  // Load a full memo with audio
  async getFullMemo(id: string): Promise<MemoWithAudio | null> {
    const memo = await this.getMemo(id);
    if (!memo) return null;
    
    const audioBlob = await this.getAudioBlob(id);
    if (!audioBlob) return null;
    
    return {
      ...memo,
      audioBlob
    };
  }

  // Get all memos with audio blobs
  async getAllMemosWithAudio(): Promise<MemoWithAudio[]> {
    const memos = await this.getAllMemos();
    
    const memosWithAudio = await Promise.all(
      memos.map(async (memo) => {
        const audioBlob = await this.getAudioBlob(memo.id);
        return audioBlob ? { ...memo, audioBlob } : null;
      })
    );
    
    return memosWithAudio.filter((memo): memo is MemoWithAudio => memo !== null);
  }

  // Save a report
  async saveReport(report: Omit<Report, 'id'>): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.db) throw new Error('Database not initialized');
    
    const id = `report_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Insert report into the database
    const stmt = this.db.prepare(`
      INSERT INTO reports (id, title, topic, analysisType, date, reportContent, memoIds)
      VALUES (:id, :title, :topic, :analysisType, :date, :reportContent, :memoIds)
    `);
    
    stmt.run({
      ':id': id,
      ':title': report.title,
      ':topic': report.topic,
      ':analysisType': report.analysisType,
      ':date': report.date,
      ':reportContent': report.reportContent,
      ':memoIds': report.memoIds
    });
    
    stmt.free();
    
    // Save the database
    await this.saveDb();
    
    return id;
  }

  // Get all reports
  async getAllReports(): Promise<Report[]> {
    await this.ensureInitialized();
    
    if (!this.db) throw new Error('Database not initialized');
    
    const result = this.db.exec(`
      SELECT id, title, topic, analysisType, date, reportContent, memoIds 
      FROM reports 
      ORDER BY date DESC
    `);
    
    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }
    
    return result[0].values.map(row => ({
      id: row[0] as string,
      title: row[1] as string,
      topic: row[2] as string,
      analysisType: row[3] as string,
      date: row[4] as string,
      reportContent: row[5] as string,
      memoIds: row[6] as string
    }));
  }

  // Get a report by ID
  async getReport(id: string): Promise<Report | null> {
    await this.ensureInitialized();
    
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      SELECT id, title, topic, analysisType, date, reportContent, memoIds 
      FROM reports 
      WHERE id = :id
    `);
    
    stmt.bind({ ':id': id });
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return {
        id: row.id as string,
        title: row.title as string,
        topic: row.topic as string,
        analysisType: row.analysisType as string,
        date: row.date as string,
        reportContent: row.reportContent as string,
        memoIds: row.memoIds as string
      };
    }
    
    stmt.free();
    return null;
  }

  // Delete a report
  async deleteReport(id: string): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('DELETE FROM reports WHERE id = :id');
    stmt.run({ ':id': id });
    stmt.free();
    
    // Save the database
    await this.saveDb();
  }

  // Import data from the old IndexedDB database (migration)
  async importFromOldDb(oldMemos: MemoWithAudio[]): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.db) throw new Error('Database not initialized');
    
    // Begin transaction
    this.db.run('BEGIN TRANSACTION');
    
    try {
      for (const memo of oldMemos) {
        const audioMimeType = memo.audioBlob.type || 'audio/webm';
        
        // Insert memo
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO memos (id, transcript, date, audioMimeType)
          VALUES (:id, :transcript, :date, :audioMimeType)
        `);
        
        stmt.run({
          ':id': memo.id,
          ':transcript': memo.transcript,
          ':date': memo.date,
          ':audioMimeType': audioMimeType
        });
        
        stmt.free();
        
        // Store audio blob with correct MIME type
        const audioBlob = new Blob([memo.audioBlob], { type: audioMimeType });
        await set(`audio_${memo.id}`, audioBlob);
      }
      
      // Commit transaction
      this.db.run('COMMIT');
      
      // Save the database
      await this.saveDb();
    } catch (error) {
      // Rollback on error
      this.db.run('ROLLBACK');
      console.error('Import failed:', error);
      throw error;
    }
  }
  
  // Migrate existing audio blobs to ensure they have correct MIME types
  async migrateAudioBlobs(): Promise<void> {
    try {
      const memos = await this.getAllMemos();
      let migrationCount = 0;
      
      for (const memo of memos) {
        const audioBlob = await get(`audio_${memo.id}`);
        if (audioBlob instanceof Blob) {
          const mimeType = memo.audioMimeType || 'audio/webm';
          
          // If blob doesn't have the correct MIME type, update it
          if (audioBlob.type !== mimeType) {
            const newBlob = new Blob([audioBlob], { type: mimeType });
            await set(`audio_${memo.id}`, newBlob);
            migrationCount++;
          }
        }
      }
      
      if (migrationCount > 0) {
        console.log(`Migrated ${migrationCount} audio blobs with correct MIME types`);
      }
    } catch (error) {
      console.error('Error during audio blob migration:', error);
    }
  }
}

// Create a singleton instance
const sqliteDatabase = new SqliteDatabase();

// Run MIME type migration on startup
(async function migrateBlobTypes() {
  await sqliteDatabase.ensureInitialized();
  await sqliteDatabase.migrateAudioBlobs();
})();

// Expose the database interface
export function useDatabase() {
  return sqliteDatabase;
}

// For backward compatibility and data migration
async function createLocalDatabase() {
  // This is a shim to maintain compatibility with the old code
  // while we transition to the new database
  
  // Check if we have legacy data to migrate
  let hasMigratedData = false;
  try {
    hasMigratedData = await get('healthvoice-data-migrated') === true;
  } catch (e) {
    console.error('Error checking migration status:', e);
  }
  
  if (!hasMigratedData) {
    try {
      // Try to open the old database
      const oldDb = await openLegacyDb();
      
      // Get all memos from the old database
      const oldMemos = await getAllMemosFromLegacyDb(oldDb);
      
      if (oldMemos.length > 0) {
        // Import data into the new database
        await sqliteDatabase.importFromOldDb(oldMemos);
        console.log(`Migrated ${oldMemos.length} memos from old database`);
      }
      
      // Mark data as migrated
      await set('healthvoice-data-migrated', true);
    } catch (e) {
      console.error('Migration failed:', e);
    }
  }
  
  // Return the legacy-compatible interface
  return {
    addMemo: async (memo: Omit<Memo, 'id'> & { audioBlob: Blob }) => {
      return sqliteDatabase.addMemo(memo);
    },
    getMemo: async (id: string) => {
      return sqliteDatabase.getFullMemo(id);
    },
    getAllMemos: async () => {
      return sqliteDatabase.getAllMemosWithAudio();
    },
    updateMemo: async (id: string, data: Partial<Omit<Memo, 'id'> & { audioBlob?: Blob }>) => {
      return sqliteDatabase.updateMemo(id, data);
    },
    deleteMemo: async (id: string) => {
      return sqliteDatabase.deleteMemo(id);
    }
  };
}

// Legacy database functions
async function openLegacyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const DB_NAME = 'health-voice-db-legacy';
    const DB_VERSION = 1;
    const MEMO_STORE = 'memos';
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(new Error('Failed to open legacy database'));
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(MEMO_STORE)) {
        const store = db.createObjectStore(MEMO_STORE, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }
    };
  });
}

async function getAllMemosFromLegacyDb(db: IDBDatabase): Promise<MemoWithAudio[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['memos'], 'readonly');
    const store = transaction.objectStore('memos');
    
    const request = store.getAll();
    
    request.onerror = () => reject(new Error('Failed to get memos from legacy database'));
    request.onsuccess = () => resolve(request.result);
  });
}