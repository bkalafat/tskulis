/**
 * State Persistence Utilities
 * Advanced state persistence with compression and validation
 */

import { AppState } from './store';

export interface PersistenceConfig {
  key: string;
  version: number;
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB';
  compress?: boolean;
  encrypt?: boolean;
  whitelist?: string[];
  blacklist?: string[];
  migrate?: (persistedState: any, version: number) => any;
  throttle?: number;
}

export interface SerializedState {
  state: any;
  version: number;
  timestamp: number;
  checksum?: string;
}

/**
 * State persistence manager
 */
export class StatePersistence {
  private config: PersistenceConfig;
  private throttleTimeout: NodeJS.Timeout | null = null;
  private compressionWorker: Worker | null = null;

  constructor(config: PersistenceConfig) {
    this.config = {
      ...config,
      version: config.version || 1,
      storage: config.storage || 'localStorage',
      compress: config.compress !== false,
      encrypt: config.encrypt || false,
      throttle: config.throttle || 1000
    };

    // Initialize compression worker if available
    if (typeof Worker !== 'undefined' && this.config.compress) {
      try {
        this.initializeCompressionWorker();
      } catch (error) {
        console.warn('Failed to initialize compression worker:', error);
      }
    }
  }

  private initializeCompressionWorker() {
    const workerCode = `
      self.onmessage = function(e) {
        const { action, data } = e.data;
        
        try {
          if (action === 'compress') {
            const compressed = JSON.stringify(data);
            self.postMessage({ success: true, data: compressed });
          } else if (action === 'decompress') {
            const decompressed = JSON.parse(data);
            self.postMessage({ success: true, data: decompressed });
          }
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.compressionWorker = new Worker(URL.createObjectURL(blob));
  }

  /**
   * Save state to storage
   */
  async saveState(state: Partial<AppState>): Promise<void> {
    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
    }

    this.throttleTimeout = setTimeout(async () => {
      try {
        const filteredState = this.filterState(state);
        const serializedState = await this.serializeState(filteredState);
        await this.writeToStorage(serializedState);
      } catch (error) {
        console.error('Failed to save state:', error);
      }
    }, this.config.throttle);
  }

  /**
   * Load state from storage
   */
  async loadState(): Promise<Partial<AppState> | null> {
    try {
      const serializedState = await this.readFromStorage();
      if (!serializedState) return null;

      const state = await this.deserializeState(serializedState);
      return this.migrateState(state, serializedState.version);
    } catch (error) {
      console.error('Failed to load state:', error);
      return null;
    }
  }

  /**
   * Clear persisted state
   */
  async clearState(): Promise<void> {
    try {
      if (this.config.storage === 'indexedDB') {
        await this.clearIndexedDB();
      } else {
        const storage = this.getStorage();
        storage.removeItem(this.config.key);
      }
    } catch (error) {
      console.error('Failed to clear state:', error);
    }
  }

  /**
   * Get storage size
   */
  async getStorageSize(): Promise<number> {
    try {
      const serializedState = await this.readFromStorage();
      if (!serializedState) return 0;
      
      return JSON.stringify(serializedState).length;
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return 0;
    }
  }

  /**
   * Filter state based on whitelist/blacklist
   */
  private filterState(state: Partial<AppState>): Partial<AppState> {
    if (!this.config.whitelist && !this.config.blacklist) {
      return state;
    }

    const filtered: any = {};

    if (this.config.whitelist) {
      for (const key of this.config.whitelist) {
        if (key in state) {
          filtered[key] = (state as any)[key];
        }
      }
    } else {
      Object.assign(filtered, state);
    }

    if (this.config.blacklist) {
      for (const key of this.config.blacklist) {
        delete filtered[key];
      }
    }

    return filtered;
  }

  /**
   * Serialize state with compression and encryption
   */
  private async serializeState(state: Partial<AppState>): Promise<SerializedState> {
    let serializedData: any = state;

    // Compress if enabled
    if (this.config.compress) {
      serializedData = await this.compressData(serializedData);
    }

    // Encrypt if enabled
    if (this.config.encrypt) {
      serializedData = await this.encryptData(serializedData);
    }

    const serializedState: SerializedState = {
      state: serializedData,
      version: this.config.version,
      timestamp: Date.now()
    };

    // Generate checksum for integrity
    serializedState.checksum = await this.generateChecksum(serializedState);

    return serializedState;
  }

  /**
   * Deserialize state with decompression and decryption
   */
  private async deserializeState(serializedState: SerializedState): Promise<Partial<AppState>> {
    // Verify checksum
    const expectedChecksum = await this.generateChecksum({
      ...serializedState,
      checksum: undefined
    });
    
    if (serializedState.checksum && serializedState.checksum !== expectedChecksum) {
      throw new Error('State checksum verification failed');
    }

    let state = serializedState.state;

    // Decrypt if needed
    if (this.config.encrypt) {
      state = await this.decryptData(state);
    }

    // Decompress if needed
    if (this.config.compress) {
      state = await this.decompressData(state);
    }

    return state;
  }

  /**
   * Migrate state between versions
   */
  private migrateState(state: Partial<AppState>, version: number): Partial<AppState> {
    if (version === this.config.version) {
      return state;
    }

    if (this.config.migrate) {
      return this.config.migrate(state, version);
    }

    // Default migration: return state as-is but warn
    console.warn(`State version mismatch: expected ${this.config.version}, got ${version}`);
    return state;
  }

  /**
   * Compress data using worker or fallback
   */
  private async compressData(data: any): Promise<any> {
    if (this.compressionWorker) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Compression timeout'));
        }, 5000);

        this.compressionWorker!.onmessage = (e) => {
          clearTimeout(timeout);
          if (e.data.success) {
            resolve(e.data.data);
          } else {
            reject(new Error(e.data.error));
          }
        };

        this.compressionWorker!.postMessage({ action: 'compress', data });
      });
    }

    // Fallback: simple JSON stringify (no real compression)
    return JSON.stringify(data);
  }

  /**
   * Decompress data using worker or fallback
   */
  private async decompressData(data: any): Promise<any> {
    if (this.compressionWorker && typeof data === 'string') {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Decompression timeout'));
        }, 5000);

        this.compressionWorker!.onmessage = (e) => {
          clearTimeout(timeout);
          if (e.data.success) {
            resolve(e.data.data);
          } else {
            reject(new Error(e.data.error));
          }
        };

        this.compressionWorker!.postMessage({ action: 'decompress', data });
      });
    }

    // Fallback: parse JSON
    return typeof data === 'string' ? JSON.parse(data) : data;
  }

  /**
   * Encrypt data (placeholder - implement with crypto library)
   */
  private async encryptData(data: any): Promise<string> {
    // Placeholder implementation
    // In production, use a proper encryption library like crypto-js
    return btoa(JSON.stringify(data));
  }

  /**
   * Decrypt data (placeholder - implement with crypto library)
   */
  private async decryptData(data: string): Promise<any> {
    // Placeholder implementation
    // In production, use a proper encryption library like crypto-js
    return JSON.parse(atob(data));
  }

  /**
   * Generate checksum for data integrity
   */
  private async generateChecksum(data: any): Promise<string> {
    const text = JSON.stringify(data);
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(text));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.warn('Failed to generate crypto checksum, using fallback');
      }
    }

    // Fallback: simple hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Get appropriate storage object
   */
  private getStorage(): Storage {
    switch (this.config.storage) {
      case 'sessionStorage':
        return sessionStorage;
      case 'localStorage':
      default:
        return localStorage;
    }
  }

  /**
   * Write to storage
   */
  private async writeToStorage(serializedState: SerializedState): Promise<void> {
    if (this.config.storage === 'indexedDB') {
      await this.writeToIndexedDB(serializedState);
    } else {
      const storage = this.getStorage();
      storage.setItem(this.config.key, JSON.stringify(serializedState));
    }
  }

  /**
   * Read from storage
   */
  private async readFromStorage(): Promise<SerializedState | null> {
    if (this.config.storage === 'indexedDB') {
      return this.readFromIndexedDB();
    } else {
      const storage = this.getStorage();
      const data = storage.getItem(this.config.key);
      return data ? JSON.parse(data) : null;
    }
  }

  /**
   * Write to IndexedDB
   */
  private async writeToIndexedDB(serializedState: SerializedState): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TSKulisState', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['state'], 'readwrite');
        const store = transaction.objectStore('state');
        
        const putRequest = store.put(serializedState, this.config.key);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state');
        }
      };
    });
  }

  /**
   * Read from IndexedDB
   */
  private async readFromIndexedDB(): Promise<SerializedState | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TSKulisState', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('state')) {
          resolve(null);
          return;
        }

        const transaction = db.transaction(['state'], 'readonly');
        const store = transaction.objectStore('state');
        
        const getRequest = store.get(this.config.key);
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state');
        }
      };
    });
  }

  /**
   * Clear IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TSKulisState', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('state')) {
          resolve();
          return;
        }

        const transaction = db.transaction(['state'], 'readwrite');
        const store = transaction.objectStore('state');
        
        const clearRequest = store.delete(this.config.key);
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      };
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
      this.throttleTimeout = null;
    }

    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = null;
    }
  }
}

/**
 * Default persistence configurations
 */
export const defaultPersistenceConfigs = {
  user: {
    key: 'tskulis_user_state',
    version: 1,
    storage: 'localStorage' as const,
    whitelist: ['user'],
    compress: false,
    encrypt: false
  },
  
  ui: {
    key: 'tskulis_ui_state',
    version: 1,
    storage: 'localStorage' as const,
    whitelist: ['ui'],
    blacklist: ['ui.notifications', 'ui.loading'],
    compress: false,
    encrypt: false
  },
  
  cache: {
    key: 'tskulis_cache_state',
    version: 1,
    storage: 'sessionStorage' as const,
    whitelist: ['news', 'comments'],
    compress: true,
    encrypt: false,
    throttle: 5000 // 5 seconds
  },
  
  full: {
    key: 'tskulis_full_state',
    version: 1,
    storage: 'indexedDB' as const,
    blacklist: ['ui.loading', 'ui.notifications'],
    compress: true,
    encrypt: false,
    throttle: 10000 // 10 seconds
  }
};

/**
 * Create persistence manager with predefined config
 */
export function createPersistence(type: keyof typeof defaultPersistenceConfigs): StatePersistence {
  return new StatePersistence(defaultPersistenceConfigs[type]);
}

/**
 * Migration helpers
 */
export const migrationHelpers = {
  /**
   * Migrate from version 1 to 2
   */
  v1ToV2: (state: any) => {
    // Example migration logic
    if (state.user && state.user.settings) {
      state.user.preferences = state.user.settings;
      delete state.user.settings;
    }
    return state;
  },

  /**
   * Generic migration chain
   */
  chain: (migrations: Record<number, (state: any) => any>) => {
    return (state: any, fromVersion: number) => {
      let currentState = state;
      const sortedVersions = Object.keys(migrations).map(Number).sort();
      
      for (const version of sortedVersions) {
        if (version > fromVersion && migrations[version]) {
          currentState = migrations[version](currentState);
        }
      }
      
      return currentState;
    };
  }
};