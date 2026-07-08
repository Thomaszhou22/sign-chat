import type { HandLandmark } from './gestureRecognizer';
import { analyzeHand, classifyGesture } from './gestureRecognizer';
import {
  loadTrainingData,
  addTrainingSample as storageAddSample,
  clearTrainingData as storageClearTraining,
  getTrainingStats as storageGetStats,
} from './storage';
import type { TrainingSample } from './storage';
import { fetchCloudSamples, isCloudEnabled, uploadSample } from './trainingApi';

const K = 5;
let cloudCache: TrainingSample[] | null = null;
let _cloudCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

// Re-export
export { storageAddSample as addTrainingSample, storageClearTraining as clearTrainingData, storageGetStats as getTrainingStats };
export type { TrainingSample };

// Normalize landmarks: center on wrist, scale by hand size
export function normalizeLandmarks(landmarks: HandLandmark[]): number[] {
  if (!landmarks || landmarks.length < 21) return [];
  const wrist = landmarks[0];
  let maxDist = 0;
  for (const lm of landmarks) {
    const d = Math.sqrt((lm.x - wrist.x) ** 2 + (lm.y - wrist.y) ** 2 + (lm.z - wrist.z) ** 2);
    if (d > maxDist) maxDist = d;
  }
  if (maxDist < 0.001) maxDist = 0.001;
  const normalized: number[] = [];
  for (const lm of landmarks) {
    normalized.push((lm.x - wrist.x) / maxDist);
    normalized.push((lm.y - wrist.y) / maxDist);
    normalized.push((lm.z - wrist.z) / maxDist);
  }
  return normalized;
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

// Merge local + cloud samples
function mergeSamples(local: Record<string, TrainingSample[]>, cloud: TrainingSample[]): Record<string, TrainingSample[]> {
  const merged: Record<string, TrainingSample[]> = {};
  const seen = new Set<number>();

  for (const [label, samples] of Object.entries(local)) {
    if (!merged[label]) merged[label] = [];
    for (const s of samples) {
      merged[label].push(s);
      seen.add(s.timestamp);
    }
  }

  for (const s of cloud) {
    if (!seen.has(s.timestamp)) {
      if (!merged[s.label]) merged[s.label] = [];
      merged[s.label].push(s);
    }
  }

  return merged;
}

// Refresh cloud cache
export async function refreshCloudCache(): Promise<void> {
  if (!isCloudEnabled()) return;
  try {
    const cloud = await fetchCloudSamples([]);
    if (cloud.length > 0) {
      cloudCache = cloud;
      _cloudCacheTime = Date.now();
    }
  } catch {
    // silent fail
  }
}

// Sync local samples to cloud
export async function syncLocalToCloud(): Promise<{ uploaded: number; failed: number; flagged: number }> {
  if (!isCloudEnabled()) return { uploaded: 0, failed: 0, flagged: 0 };
  const local = loadTrainingData();
  let uploaded = 0, failed = 0, flagged = 0;

  for (const [label, samples] of Object.entries(local)) {
    for (const sample of samples) {
      const result = await uploadSample(label, sample.landmarks);
      if (result.success) uploaded++;
      else if (result.flagged) flagged++;
      else failed++;
    }
  }
  return { uploaded, failed, flagged };
}

// k-NN classification (local only, fast for real-time)
export function classifyWithKNN(
  landmarks: HandLandmark[],
  allowedLabels?: Set<string>
): { label: string; confidence: number; distance: number } | null {
  const local = loadTrainingData();
  const cloud = cloudCache || [];
  const data = mergeSamples(local, cloud);

  const allSamples: TrainingSample[] = [];
  for (const [label, samples] of Object.entries(data)) {
    if (allowedLabels && !allowedLabels.has(label)) continue;
    allSamples.push(...samples);
  }

  if (allSamples.length === 0) return null;

  const query = normalizeLandmarks(landmarks);
  if (query.length !== 63) return null;

  const distances = allSamples.map(s => ({ label: s.label, distance: euclideanDistance(query, s.landmarks) }));
  distances.sort((a, b) => a.distance - b.distance);

  const k = Math.min(K, distances.length);
  const neighbors = distances.slice(0, k);

  const voteCount: Record<string, number> = {};
  for (const n of neighbors) {
    voteCount[n.label] = (voteCount[n.label] || 0) + 1 / (n.distance + 0.001);
  }

  let bestLabel = '', bestVotes = 0;
  for (const [label, votes] of Object.entries(voteCount)) {
    if (votes > bestVotes) { bestVotes = votes; bestLabel = label; }
  }

  const totalVotes = Object.values(voteCount).reduce((a, b) => a + b, 0);
  const confidence = totalVotes > 0 ? bestVotes / totalVotes : 0;
  const bestNeighbors = neighbors.filter(n => n.label === bestLabel);
  const avgDistance = bestNeighbors.reduce((s, n) => s + n.distance, 0) / bestNeighbors.length;

  return { label: bestLabel, confidence, distance: avgDistance };
}

// Hybrid classifier
export function classifyHybrid(
  landmarks: HandLandmark[],
  handedness: 'left' | 'right',
  levelId?: string
): { label: string; confidence: number; source: 'knn' | 'rule' | 'none' } | null {
  const allowedLabels = getAllowedLabels(levelId);

  const knnResult = classifyWithKNN(landmarks, allowedLabels);
  if (knnResult && knnResult.confidence > 0.6 && knnResult.distance < 0.5) {
    return { ...knnResult, source: 'knn' };
  }

  const hand = analyzeHand(landmarks, handedness);
  const ruleResult = classifyGesture(hand, levelId);
  if (ruleResult) {
    return { label: ruleResult.label, confidence: ruleResult.confidence, source: 'rule' };
  }

  return null;
}

function getAllowedLabels(levelId?: string): Set<string> | undefined {
  if (!levelId) return undefined;
  const letters = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
  const numbers = new Set(['0','1','2','3','4','5','6','7','8','9']);
  const words = new Set(['Hello','Thank you','Please','Yes','No','Sorry','Help','Good','Bad','Friend','Love','Name']);
  const phrases = new Set(['How are you','My name is','Nice to meet you','I love you','See you later','Good morning','Good night','Excuse me']);
  switch (levelId) {
    case 'alphabet': return letters;
    case 'numbers': return numbers;
    case 'common-words': return words;
    case 'phrases': return new Set([...letters, ...numbers, ...words, ...phrases]);
    default: return undefined;
  }
}

export function hasTrainingData(): boolean {
  const stats = storageGetStats();
  const totalSamples = Object.values(stats).reduce((a, b) => a + b, 0);
  return totalSamples > 0 || isCloudEnabled();
}

// Auto-refresh cloud cache periodically
if (isCloudEnabled()) {
  refreshCloudCache();
  setInterval(refreshCloudCache, CACHE_TTL);
}

// Keep _cloudCacheTime referenced
void _cloudCacheTime;
