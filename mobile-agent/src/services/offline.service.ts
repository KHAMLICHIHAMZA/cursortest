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

  private stableStringify(value: any): string {
    const seen = new WeakSet();
    const normalize = (v: any): any => {
      if (v === null || typeof v !== 'object') return v;
      if (seen.has(v)) return '[Circular]';
      seen.add(v);

      if (Array.isArray(v)) return v.map(normalize);

      const keys = Object.keys(v).sort();
      const out: any = {};
      for (const k of keys) out[k] = normalize(v[k]);
      return out;
    };

    return JSON.stringify(normalize(value));
  }

  private normalizeFiles(files?: string[]): string[] {
    return (files || []).slice().sort();
  }

  private getActionPayloadString(action: OfflineAction): string {
    try {
      return this.stableStringify(JSON.parse(action.payload || '{}'));
    } catch {
      return this.stableStringify({});
    }
  }

  private async findExistingActionId(actionType: string, bookingId: string): Promise<string | null> {
    try {
      const actions = await this.getPendingActions();
      for (const action of actions) {
        if (action.actionType !== actionType) continue;
        try {
          const payload = JSON.parse(action.payload || '{}');
          if (payload?.bookingId === bookingId) {
            return action.id;
          }
        } catch {
          // ignore invalid JSON payloads
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  private async upsertActionById(
    id: string,
    actionType: string,
    payload: any,
    files?: string[],
  ): Promise<void> {
    const now = new Date().toISOString();

    if (Platform.OS === 'web') {
      const existing = localStorage.getItem('offline_actions') || '[]';
      const actions = JSON.parse(existing);
      const idx = actions.findIndex((a: any) => a.id === id);
      const row = {
        id,
        actionType,
        payload: JSON.stringify(payload),
        files: files ? JSON.stringify(files) : null,
        retryCount: 0,
        lastError: null,
        createdAt: actions[idx]?.createdAt || now,
        updatedAt: now,
      };
      if (idx >= 0) {
        actions[idx] = { ...actions[idx], ...row };
      } else {
        actions.push(row);
      }
      localStorage.setItem('offline_actions', JSON.stringify(actions));
      return;
    }

    if (!this.db) await this.init();
    if (!this.db?.runAsync) throw new Error('Database not initialized');

    // Try update first (upsert)
    const update = await this.db.runAsync(
      `UPDATE offline_actions
       SET actionType = ?, payload = ?, files = ?, retryCount = 0, lastError = NULL, updatedAt = ?
       WHERE id = ?`,
      [actionType, JSON.stringify(payload), files ? JSON.stringify(files) : null, now, id],
    );

    if (update.changes && update.changes > 0) return;

    await this.db.runAsync(
      `INSERT INTO offline_actions (id, actionType, payload, files, retryCount, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [id, actionType, JSON.stringify(payload), files ? JSON.stringify(files) : null, now, now],
    );
  }

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
    // Dedup rule: for booking actions, keep only one pending action per (actionType, bookingId)
    const bookingId = payload?.bookingId;
    const shouldDedup =
      typeof bookingId === 'string' &&
      bookingId.length > 0 &&
      (actionType === 'BOOKING_CHECKIN' || actionType === 'BOOKING_CHECKOUT');

    if (shouldDedup) {
      // If same bookingId+actionType exists, only update when data actually changed
      const actions = await this.getPendingActions();
      const existing = actions.find((a) => {
        if (a.actionType !== actionType) return false;
        try {
          const p = JSON.parse(a.payload || '{}');
          return p?.bookingId === bookingId;
        } catch {
          return false;
        }
      });

      if (existing) {
        const existingPayloadStr = this.getActionPayloadString(existing);
        const newPayloadStr = this.stableStringify(payload);
        const existingFiles = this.normalizeFiles(existing.files);
        const newFiles = this.normalizeFiles(files);

        const isSamePayload = existingPayloadStr === newPayloadStr;
        const isSameFiles =
          existingFiles.length === newFiles.length &&
          existingFiles.every((v, i) => v === newFiles[i]);

        if (isSamePayload && isSameFiles) {
          // Nothing changed: do not update timestamps or retry count
          return existing.id;
        }

        await this.upsertActionById(existing.id, actionType, payload, files);
        return existing.id;
      }
    }

    if (Platform.OS === 'web') {
      // Web fallback: use localStorage
      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await this.upsertActionById(id, actionType, payload, files);
      return id;
    }

    if (!this.db) await this.init();
    if (!this.db?.runAsync) throw new Error('Database not initialized');

    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.upsertActionById(id, actionType, payload, files);

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

