// Centralized localStorage management for sign-chat app
// ALL localStorage access goes through this module — components never touch localStorage directly

export const STORAGE_KEYS = {
  PROGRESS: 'signchat-progress',
  DAILY_STATS: 'daily-stats',
  TEST_RECORDS: 'test-records',
  KNN_TRAINING: 'signchat-knn-training',
  MISTAKES_PREFIX: 'mistakes-',
} as const;

// ===== Progress =====

export interface LevelProgress {
  completed: string[];
  mastered: string[];
}

export type ProgressData = Record<string, LevelProgress>;

export function loadProgress(): ProgressData {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveProgress(data: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

export function markCompleted(levelId: string, signLabel: string, type: 'completed' | 'mastered'): ProgressData {
  const data = loadProgress();
  const lp = data[levelId] || { completed: [], mastered: [] };
  if (type === 'completed' && !lp.completed.includes(signLabel)) {
    lp.completed.push(signLabel);
  } else if (type === 'mastered' && !lp.mastered.includes(signLabel)) {
    lp.mastered.push(signLabel);
  }
  data[levelId] = lp;
  saveProgress(data);
  return data;
}

export function toggleCompleted(levelId: string, signLabel: string): ProgressData {
  const data = loadProgress();
  const lp = data[levelId] || { completed: [], mastered: [] };
  if (lp.completed.includes(signLabel)) {
    lp.completed = lp.completed.filter(l => l !== signLabel);
  } else {
    lp.completed.push(signLabel);
  }
  data[levelId] = lp;
  saveProgress(data);
  return data;
}

// ===== Mistakes =====

export interface Mistake {
  sign: string;
  count: number;
  lastAttempt: number;
}

export function loadMistakes(levelId: string): Mistake[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MISTAKES_PREFIX + levelId);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveMistakes(levelId: string, mistakes: Mistake[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MISTAKES_PREFIX + levelId, JSON.stringify(mistakes));
  } catch (e) {
    console.error('Failed to save mistakes:', e);
  }
}

export function recordMistake(levelId: string, signLabel: string): Mistake[] {
  const mistakes = loadMistakes(levelId);
  const existing = mistakes.find(m => m.sign === signLabel);
  if (existing) {
    existing.count++;
    existing.lastAttempt = Date.now();
  } else {
    mistakes.push({ sign: signLabel, count: 1, lastAttempt: Date.now() });
  }
  saveMistakes(levelId, mistakes);
  return mistakes;
}

export function clearMistakes(levelId: string): void {
  localStorage.removeItem(STORAGE_KEYS.MISTAKES_PREFIX + levelId);
}

// ===== Daily Stats =====

export interface DailyStats {
  date: string;
  practiceMinutes: number;
  signsPracticed: number;
  correctAnswers: number;
}

export function loadDailyStats(): DailyStats[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_STATS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveDailyStats(stats: DailyStats[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save daily stats:', e);
  }
}

// ===== Test Records =====

export interface TestRecord {
  levelId: string;
  date: string;
  totalSigns: number;
  correct: number;
  accuracy: number;
  wpm: number;
}

export function loadTestRecords(): TestRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TEST_RECORDS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveTestRecords(records: TestRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEST_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save test records:', e);
  }
}

export function addTestRecord(record: TestRecord): TestRecord[] {
  const records = loadTestRecords();
  records.push(record);
  saveTestRecords(records);
  return records;
}

// ===== k-NN Training Data =====

export interface TrainingSample {
  label: string;
  landmarks: number[];
  timestamp: number;
}

export function loadTrainingData(): Record<string, TrainingSample[]> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.KNN_TRAINING);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveTrainingData(data: Record<string, TrainingSample[]>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.KNN_TRAINING, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save training data:', e);
  }
}

export function addTrainingSample(label: string, normalizedLandmarks: number[]): void {
  const data = loadTrainingData();
  if (!data[label]) data[label] = [];
  data[label].push({
    label,
    landmarks: normalizedLandmarks,
    timestamp: Date.now(),
  });
  saveTrainingData(data);
}

export function clearTrainingData(label?: string): void {
  if (label) {
    const data = loadTrainingData();
    delete data[label];
    saveTrainingData(data);
  } else {
    localStorage.removeItem(STORAGE_KEYS.KNN_TRAINING);
  }
}

export function getTrainingStats(): Record<string, number> {
  const data = loadTrainingData();
  const stats: Record<string, number> = {};
  for (const [label, samples] of Object.entries(data)) {
    stats[label] = samples.length;
  }
  return stats;
}

// ===== Bulk Operations =====

export function getAllStorageKeys(): string[] {
  const keys: string[] = [
    STORAGE_KEYS.PROGRESS,
    STORAGE_KEYS.DAILY_STATS,
    STORAGE_KEYS.TEST_RECORDS,
    STORAGE_KEYS.KNN_TRAINING,
  ];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEYS.MISTAKES_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

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

export function clearStorageKey(key: string): void {
  localStorage.removeItem(key);
}

export function clearAllAppData(): void {
  const keys = getAllStorageKeys();
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

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

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
