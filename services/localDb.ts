
import { Event, Asset, AppSettings } from '../types';

const DB_NAME = 'EventForgeDB';
const DB_VERSION = 2; // Incremented version for new store
const STORES = {
  EVENTS: 'events',
  ASSETS: 'assets',
  SETTINGS: 'settings'
};

// Open Database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.EVENTS)) {
        db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.ASSETS)) {
        db.createObjectStore(STORES.ASSETS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }
    };
  });
};

// Generic Promisified Transaction
const performTransaction = async <T>(
  storeName: string, 
  mode: IDBTransactionMode, 
  operation: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = operation(store);

    transaction.oncomplete = () => {
      // If the operation returned a request, resolve with its result
      if (request) resolve((request as IDBRequest).result);
      else resolve(undefined as T);
    };
    transaction.onerror = () => reject(transaction.error);
  });
};

export const LocalDB = {
  // --- Events ---
  getAllEvents: async (): Promise<Event[]> => {
    return performTransaction(STORES.EVENTS, 'readonly', (store) => store.getAll());
  },
  
  saveEvent: async (event: Event): Promise<void> => {
    const cleanEvent = JSON.parse(JSON.stringify(event));
    await performTransaction(STORES.EVENTS, 'readwrite', (store) => store.put(cleanEvent));
  },

  deleteEvent: async (id: string): Promise<void> => {
    await performTransaction(STORES.EVENTS, 'readwrite', (store) => store.delete(id));
  },

  clearAllEvents: async (): Promise<void> => {
    await performTransaction(STORES.EVENTS, 'readwrite', (store) => store.clear());
  },

  // --- Assets (Handling Blobs) ---
  getAllAssets: async (): Promise<Asset[]> => {
    return performTransaction(STORES.ASSETS, 'readonly', (store) => store.getAll());
  },

  saveAsset: async (asset: Asset, fileBlob?: Blob): Promise<void> => {
    const record = { ...asset, blob: fileBlob }; 
    await performTransaction(STORES.ASSETS, 'readwrite', (store) => store.put(record));
  },

  deleteAsset: async (id: string): Promise<void> => {
    await performTransaction(STORES.ASSETS, 'readwrite', (store) => store.delete(id));
  },

  // --- Settings ---
  getSettings: async (): Promise<AppSettings | undefined> => {
    return performTransaction(STORES.SETTINGS, 'readonly', (store) => store.get('global'));
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
     await performTransaction(STORES.SETTINGS, 'readwrite', (store) => store.put({ ...settings, id: 'global' }));
  },
  
  // Initialize with seed data if empty
  seedData: async (initialEvents: Event[], initialAssets: Asset[]) => {
    const events = await LocalDB.getAllEvents();
    if (events.length === 0) {
      for (const e of initialEvents) await LocalDB.saveEvent(e);
    }
    const assets = await LocalDB.getAllAssets();
    if (assets.length === 0) {
        for (const a of initialAssets) await LocalDB.saveAsset(a);
    }
  },

  // --- Backup & Restore ---
  createBackup: async (): Promise<string> => {
    const events = await LocalDB.getAllEvents();
    const settings = await LocalDB.getSettings();
    // Note: We are not exporting Blob assets in this JSON backup to avoid memory crashes.
    // We only export the text data.
    const backupData = {
      timestamp: new Date().toISOString(),
      events,
      settings
    };
    return JSON.stringify(backupData, null, 2);
  },

  restoreBackup: async (jsonString: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonString);
      
      if (data.events && Array.isArray(data.events)) {
        for (const e of data.events) {
          await LocalDB.saveEvent(e);
        }
      }
      
      if (data.settings) {
        await LocalDB.saveSettings(data.settings);
      }
      return true;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  }
};
