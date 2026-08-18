const DB_NAME = 'LilyBloomDB';
const DB_VERSION = 1;

class DBService {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('cycles')) {
          db.createObjectStore('cycles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('moodEntries')) {
          db.createObjectStore('moodEntries', { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('IndexedDB init error:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  async getDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  async saveCycle(cycle) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cycles', 'readwrite');
      const store = tx.objectStore('cycles');

      const cycleData = { ...cycle };
      if (!cycleData.id) {
        cycleData.id = Date.now(); // Pastikan selalu ada ID unik
      }

      const req = store.put(cycleData);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getCycles() {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cycles', 'readonly');
      const store = tx.objectStore('cycles');
      const req = store.getAll();

      req.onsuccess = () => {
        const result = req.result || [];
        result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        resolve(result);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getMoodEntries() {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('moodEntries', 'readonly');
      const store = tx.objectStore('moodEntries');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async saveMoodEntry(entry) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('moodEntries', 'readwrite');
      const store = tx.objectStore('moodEntries');
      const req = store.put(entry);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteCycle(id) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cycles', 'readwrite');
      const store = tx.objectStore('cycles');
      const req = store.delete(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getSettings() {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }
}

export const dbService = new DBService();