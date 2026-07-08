// Centralized localStorage management for sign-chat app
// All storage keys in one place, with utilities for clearing/exporting/importing

export const STORAGE_KEYS = {
  PROGRESS: 'signchat-progress',
  DAILY_STATS: 'daily-stats',
  TEST_RECORDS: 'test-records',
  KNN_TRAINING: 'signchat-knn-training',
  MISTAKES_PREFIX: 'mistakes-', // + levelId
} as const;

// Get all storage keys including per-level mistake keys
export function getAllStorageKeys(): string[] {
  const keys: string[] = [
    STORAGE_KEYS.PROGRESS,
    STORAGE_KEYS.DAILY_STATS,
    STORAGE_KEYS.TEST_RECORDS,
    STORAGE_KEYS.KNN_TRAINING,
  ];

  // Find all mistake keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEYS.MISTAKES_PREFIX)) {
      keys.push(key);
    }
  }

  return keys;
}

// Get storage usage info for each key
export function getStorageInfo(): { key: string; label: string; size: number; items: number }[] {
  const keyInfo: { key: string; label: string; size: number; items: number }[] = [
    { key: STORAGE_KEYS.PROGRESS, label: 'Learning Progress', size: 0, items: 0 },
    { key: STORAGE_KEYS.DAILY_STATS, label: 'Daily Stats', size: 0, items: 0 },
    { key: STORAGE_KEYS.TEST_RECORDS, label: 'Test Records', size: 0, items: 0 },
    { key: STORAGE_KEYS.KNN_TRAINING, label: 'k-NN Training Data', size: 0, items: 0 },
  ];

  for (const info of keyInfo) {
    const data = localStorage.getItem(info.key);
    if (data) {
      info.size = new Blob([data]).size;
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) info.items = parsed.length;
        else if (typeof parsed === 'object') {
          if (info.key === STORAGE_KEYS.PROGRESS) {
            info.items = Object.values(parsed).reduce((sum: number, val: any) => {
              return sum + (val.completed?.length || 0) + (val.mastered?.length || 0);
            }, 0);
          } else if (info.key === STORAGE_KEYS.KNN_TRAINING) {
            info.items = Object.values(parsed).reduce((sum: number, val: any) => sum + (val?.length || 0), 0);
          } else {
            info.items = Object.keys(parsed).length;
          }
        }
      } catch {
        info.items = 0;
      }
    }
  }

  // Add mistake keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEYS.MISTAKES_PREFIX)) {
      const data = localStorage.getItem(key);
      const levelId = key.replace(STORAGE_KEYS.MISTAKES_PREFIX, '');
      keyInfo.push({
        key,
        label: `Mistakes (${levelId})`,
        size: data ? new Blob([data]).size : 0,
        items: data ? (JSON.parse(data).length || 0) : 0,
      });
    }
  }

  return keyInfo.filter(info => info.size > 0);
}

// Clear a specific storage key
export function clearStorageKey(key: string): void {
  localStorage.removeItem(key);
}

// Clear all app data
export function clearAllAppData(): void {
  const keys = getAllStorageKeys();
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

// Clear all mistakes data
export function clearAllMistakes(): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEYS.MISTAKES_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

// Export all data as JSON
export function exportAllData(): string {
  const data: Record<string, any> = {};
  const keys = getAllStorageKeys();
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value;
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

// Import data from JSON
export function importAllData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
    return true;
  } catch {
    return false;
  }
}

// Format bytes to human readable
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
