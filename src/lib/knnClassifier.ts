import type { HandLandmark } from './gestureRecognizer';
import { analyzeHand, classifyGesture } from './gestureRecognizer';
import {
  loadTrainingData,
  addTrainingSample as storageAddSample,
  clearTrainingData as storageClearTraining,
  getTrainingStats as storageGetStats,
} from './storage';
import type { TrainingSample } from './storage';

const K = 5;

// Re-export for components that import from here
export { storageAddSample as addTrainingSample, storageClearTraining as clearTrainingData, storageGetStats as getTrainingStats };
export type { TrainingSample };

// Normalize landmarks: center on wrist, scale by hand size
function normalizeLandmarks(landmarks: HandLandmark[]): number[] {
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
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// k-NN classification
export function classifyWithKNN(
  landmarks: HandLandmark[],
  allowedLabels?: Set<string>
): { label: string; confidence: number; distance: number } | null {
  const data = loadTrainingData();

  const allSamples: TrainingSample[] = [];
  for (const [label, samples] of Object.entries(data)) {
    if (allowedLabels && !allowedLabels.has(label)) continue;
    allSamples.push(...samples);
  }

  if (allSamples.length === 0) return null;

  const query = normalizeLandmarks(landmarks);
  if (query.length !== 63) return null;

  const distances = allSamples.map(sample => ({
    label: sample.label,
    distance: euclideanDistance(query, sample.landmarks),
  }));

  distances.sort((a, b) => a.distance - b.distance);

  const k = Math.min(K, distances.length);
  const neighbors = distances.slice(0, k);

  const voteCount: Record<string, number> = {};
  for (const neighbor of neighbors) {
    const weight = 1 / (neighbor.distance + 0.001);
    voteCount[neighbor.label] = (voteCount[neighbor.label] || 0) + weight;
  }

  let bestLabel = '';
  let bestVotes = 0;
  for (const [label, votes] of Object.entries(voteCount)) {
    if (votes > bestVotes) {
      bestVotes = votes;
      bestLabel = label;
    }
  }

  const totalVotes = Object.values(voteCount).reduce((a, b) => a + b, 0);
  const confidence = totalVotes > 0 ? bestVotes / totalVotes : 0;

  const bestNeighbors = neighbors.filter(n => n.label === bestLabel);
  const avgDistance = bestNeighbors.reduce((sum, n) => sum + n.distance, 0) / bestNeighbors.length;

  return { label: bestLabel, confidence, distance: avgDistance };
}

// Hybrid classifier: k-NN first, rule-based fallback
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

  const letterLabels = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
  const numberLabels = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  const wordLabels = new Set(['Hello', 'Thank you', 'Please', 'Yes', 'No', 'Sorry', 'Help', 'Good', 'Bad', 'Friend', 'Love', 'Name']);
  const phraseLabels = new Set(['How are you', 'My name is', 'Nice to meet you', 'I love you', 'See you later', 'Good morning', 'Good night', 'Excuse me']);

  switch (levelId) {
    case 'alphabet': return letterLabels;
    case 'numbers': return numberLabels;
    case 'common-words': return wordLabels;
    case 'phrases': return new Set([...letterLabels, ...numberLabels, ...wordLabels, ...phraseLabels]);
    default: return undefined;
  }
}

export function hasTrainingData(): boolean {
  const stats = storageGetStats();
  const totalSamples = Object.values(stats).reduce((a, b) => a + b, 0);
  return totalSamples > 0;
}
