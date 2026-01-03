import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Import expo-sqlite conditionally (not available on web)
let SQLite: any = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

const DB_NAME = 'malocauto_offline.db';

export interface OfflineAction {
  id: string;
  actionType: string;
  payload: string; // JSON string
  files?: string[]; // Array of local file URIs
  retryCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

// Type for SQLite database
type SQLiteDatabase = {
  execSync?: (query: string, readOnly?: boolean) => any;
  execAsync?: (query: string, readOnly?: boolean) => Promise<any>;
  getAllSync?: (query: string, params?: any[]) => any[];
  getAllAsync?: (query: string, params?: any[]) => Promise<any[]>;
  runSync?: (query: string, params?: any[]) => { lastInsertRowId: number; changes: number };
  runAsync?: (query: string, params?: any[]) => Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync?: (query: string, params?: any[]) => Promise<any>;
  closeSync?: () => void;
  closeAsync?: () => Promise<void>;
};

class OfflineService {
  private db: SQLiteDatabase | null = null;

  async init(): Promise<void> {
    // On web, use localStorage as fallback (expo-sqlite not available)
    if (Platform.OS === 'web') {
      console.warn('Offline service: Using localStorage fallback on web (expo-sqlite not available)');
      return;
    }

    if (!SQLite) {
      throw new Error('expo-sqlite is not available on this platform');
    }

    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
    } catch (error) {
      console.error('Error initializing offline database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db || !this.db.execAsync) return;

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_actions (
        id TEXT PRIMARY KEY,
        actionType TEXT NOT NULL,
        payload TEXT NOT NULL,
        files TEXT,
        retryCount INTEGER DEFAULT 0,
        lastError TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_action_type ON offline_actions(actionType);
      CREATE INDEX IF NOT EXISTS idx_retry_count ON offline_actions(retryCount);
    `);
  }

  async addAction(
    actionType: string,
    payload: any,
    files?: string[]
  ): Promise<string> {
    if (Platform.OS === 'web') {
      // Web fallback: use localStorage
      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const action = {
        id,
        actionType,
        payload: JSON.stringify(payload),
        files: files ? JSON.stringify(files) : null,
        retryCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      const existing = localStorage.getItem('offline_actions') || '[]';
      const actions = JSON.parse(existing);
      actions.push(action);
      localStorage.setItem('offline_actions', JSON.stringify(actions));
      return id;
    }

    if (!this.db) await this.init();
    if (!this.db?.runAsync) throw new Error('Database not initialized');

    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO offline_actions (id, actionType, payload, files, retryCount, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [
        id,
        actionType,
        JSON.stringify(payload),
        files ? JSON.stringify(files) : null,
        now,
        now,
      ]
    );

    return id;
  }

  async getPendingActions(): Promise<OfflineAction[]> {
    if (Platform.OS === 'web') {
      // Web fallback: use localStorage
      const existing = localStorage.getItem('offline_actions') || '[]';
      const actions = JSON.parse(existing);
      return actions.map((row: any) => ({
        id: row.id,
        actionType: row.actionType,
        payload: row.payload,
        files: row.files ? JSON.parse(row.files) : [],
        retryCount: row.retryCount || 0,
        lastError: row.lastError,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }

    if (!this.db) await this.init();
    if (!this.db?.getAllAsync) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM offline_actions ORDER BY createdAt ASC`
    );

    return result.map((row: any) => ({
      id: row.id,
      actionType: row.actionType,
      payload: row.payload,
      files: row.files ? JSON.parse(row.files) : [],
      retryCount: row.retryCount,
      lastError: row.lastError,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async updateActionError(id: string, error: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Web fallback: use localStorage
      const existing = localStorage.getItem('offline_actions') || '[]';
      const actions = JSON.parse(existing);
      const action = actions.find((a: any) => a.id === id);
      if (action) {
        action.retryCount = (action.retryCount || 0) + 1;
        action.lastError = error;
        action.updatedAt = new Date().toISOString();
        localStorage.setItem('offline_actions', JSON.stringify(actions));
      }
      return;
    }

    if (!this.db) await this.init();

    if (!this.db?.runAsync) throw new Error('Database not initialized');
    await this.db.runAsync(
      `UPDATE offline_actions 
       SET retryCount = retryCount + 1, lastError = ?, updatedAt = ?
       WHERE id = ?`,
      [error, new Date().toISOString(), id]
    );
  }

  async removeAction(id: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Web fallback: use localStorage
      const existing = localStorage.getItem('offline_actions') || '[]';
      const actions = JSON.parse(existing);
      const filtered = actions.filter((a: any) => a.id !== id);
      localStorage.setItem('offline_actions', JSON.stringify(filtered));
      return;
    }

    if (!this.db) await this.init();

    if (!this.db?.runAsync) throw new Error('Database not initialized');
    await this.db.runAsync(`DELETE FROM offline_actions WHERE id = ?`, [id]);
  }

  async clearAllActions(): Promise<void> {
    if (Platform.OS === 'web') {
      // Web fallback: use localStorage
      localStorage.setItem('offline_actions', '[]');
      return;
    }

    if (!this.db) await this.init();

    if (!this.db?.runAsync) throw new Error('Database not initialized');
    await this.db.runAsync(`DELETE FROM offline_actions`);
  }

  async getActionCount(): Promise<number> {
    if (Platform.OS === 'web') {
      // Web fallback: use localStorage
      const existing = localStorage.getItem('offline_actions') || '[]';
      const actions = JSON.parse(existing);
      return actions.length;
    }

    if (!this.db) await this.init();

    if (!this.db?.getFirstAsync) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM offline_actions`
    );

    return result?.count || 0;
  }
}

export const offlineService = new OfflineService();

