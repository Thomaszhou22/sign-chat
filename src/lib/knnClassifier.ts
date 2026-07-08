import type { HandLandmark } from './gestureRecognizer';
import { analyzeHand, classifyGesture } from './gestureRecognizer';

// k-NN gesture classifier using MediaPipe hand landmarks
// Stores reference samples in localStorage and classifies by nearest neighbor distance

export interface TrainingSample {
  label: string;
  landmarks: number[]; // 63 values: 21 landmarks × 3 coords (normalized)
  timestamp: number;
}

const STORAGE_KEY = 'signchat-knn-training';
const K = 5; // number of neighbors to consider

// Normalize landmarks: center on wrist, scale by hand size
function normalizeLandmarks(landmarks: HandLandmark[]): number[] {
  if (!landmarks || landmarks.length < 21) return [];

  const wrist = landmarks[0];
  
  // Compute hand size as max distance from wrist to any landmark
  let maxDist = 0;
  for (const lm of landmarks) {
    const d = Math.sqrt((lm.x - wrist.x) ** 2 + (lm.y - wrist.y) ** 2 + (lm.z - wrist.z) ** 2);
    if (d > maxDist) maxDist = d;
  }
  if (maxDist < 0.001) maxDist = 0.001; // avoid division by zero

  // Normalize: subtract wrist position, divide by hand size
  const normalized: number[] = [];
  for (const lm of landmarks) {
    normalized.push((lm.x - wrist.x) / maxDist);
    normalized.push((lm.y - wrist.y) / maxDist);
    normalized.push((lm.z - wrist.z) / maxDist);
  }
  return normalized;
}

// Compute Euclidean distance between two normalized landmark vectors
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Load all training samples from localStorage
export function loadTrainingData(): Record<string, TrainingSample[]> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load training data:', e);
  }
  return {};
}

// Save training data to localStorage
export function saveTrainingData(data: Record<string, TrainingSample[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save training data:', e);
  }
}

// Add a training sample for a specific label
export function addTrainingSample(label: string, landmarks: HandLandmark[]): void {
  const normalized = normalizeLandmarks(landmarks);
  if (normalized.length !== 63) return;

  const data = loadTrainingData();
  if (!data[label]) data[label] = [];

  const sample: TrainingSample = {
    label,
    landmarks: normalized,
    timestamp: Date.now(),
  };

  data[label].push(sample);
  saveTrainingData(data);
}

// Clear training data for a specific label
export function clearTrainingData(label?: string): void {
  if (label) {
    const data = loadTrainingData();
    delete data[label];
    saveTrainingData(data);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Get training data stats
export function getTrainingStats(): Record<string, number> {
  const data = loadTrainingData();
  const stats: Record<string, number> = {};
  for (const [label, samples] of Object.entries(data)) {
    stats[label] = samples.length;
  }
  return stats;
}

// k-NN classification: find nearest neighbors and vote
export function classifyWithKNN(
  landmarks: HandLandmark[],
  allowedLabels?: Set<string>
): { label: string; confidence: number; distance: number } | null {
  const data = loadTrainingData();
  
  // Flatten all samples into a list
  const allSamples: TrainingSample[] = [];
  for (const [label, samples] of Object.entries(data)) {
    // Filter by allowed labels if provided (for level-based filtering)
    if (allowedLabels && !allowedLabels.has(label)) continue;
    allSamples.push(...samples);
  }

  if (allSamples.length === 0) return null;

  // Normalize query landmarks
  const query = normalizeLandmarks(landmarks);
  if (query.length !== 63) return null;

  // Compute distances to all samples
  const distances = allSamples.map(sample => ({
    label: sample.label,
    distance: euclideanDistance(query, sample.landmarks),
  }));

  // Sort by distance (ascending)
  distances.sort((a, b) => a.distance - b.distance);

  // Take k nearest neighbors
  const k = Math.min(K, distances.length);
  const neighbors = distances.slice(0, k);

  // Vote: count labels among neighbors
  const voteCount: Record<string, number> = {};
  // Weight votes by inverse distance (closer = more weight)
  for (const neighbor of neighbors) {
    const weight = 1 / (neighbor.distance + 0.001);
    voteCount[neighbor.label] = (voteCount[neighbor.label] || 0) + weight;
  }

  // Find the label with the most votes
  let bestLabel = '';
  let bestVotes = 0;
  for (const [label, votes] of Object.entries(voteCount)) {
    if (votes > bestVotes) {
      bestVotes = votes;
      bestLabel = label;
    }
  }

  // Confidence = proportion of weighted votes for the best label
  const totalVotes = Object.values(voteCount).reduce((a, b) => a + b, 0);
  const confidence = totalVotes > 0 ? bestVotes / totalVotes : 0;

  // Average distance to the best label's neighbors
  const bestNeighbors = neighbors.filter(n => n.label === bestLabel);
  const avgDistance = bestNeighbors.reduce((sum, n) => sum + n.distance, 0) / bestNeighbors.length;

  return {
    label: bestLabel,
    confidence,
    distance: avgDistance,
  };
}

// Hybrid classifier: combine k-NN with rule-based classification
export function classifyHybrid(
  landmarks: HandLandmark[],
  handedness: 'left' | 'right',
  levelId?: string
): { label: string; confidence: number; source: 'knn' | 'rule' | 'none' } | null {
  // Determine allowed labels based on level
  const allowedLabels = getAllowedLabels(levelId);

  // Try k-NN first if we have training data
  const knnResult = classifyWithKNN(landmarks, allowedLabels);
  if (knnResult && knnResult.confidence > 0.6 && knnResult.distance < 0.5) {
    return { ...knnResult, source: 'knn' };
  }

  // Fall back to rule-based classification
  const hand = analyzeHand(landmarks, handedness);
  const ruleResult = classifyGesture(hand, levelId);
  if (ruleResult) {
    return { label: ruleResult.label, confidence: ruleResult.confidence, source: 'rule' };
  }

  return null;
}

// Get allowed labels for a specific level
function getAllowedLabels(levelId?: string): Set<string> | undefined {
  if (!levelId) return undefined;

  const letterLabels = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
  const numberLabels = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  const wordLabels = new Set(['Hello', 'Thank you', 'Please', 'Yes', 'No', 'Sorry', 'Help', 'Good', 'Bad', 'Friend', 'Love', 'Name']);
  const phraseLabels = new Set(['How are you', 'My name is', 'Nice to meet you', 'I love you', 'See you later', 'Good morning', 'Good night', 'Excuse me']);

  switch (levelId) {
    case 'alphabet':
      return letterLabels;
    case 'numbers':
      return numberLabels;
    case 'common-words':
      return wordLabels;
    case 'phrases':
      return new Set([...letterLabels, ...numberLabels, ...wordLabels, ...phraseLabels]);
    default:
      return undefined;
  }
}

// Check if we have enough training data for k-NN to work
export function hasTrainingData(): boolean {
  const stats = getTrainingStats();
  const totalSamples = Object.values(stats).reduce((a, b) => a + b, 0);
  return totalSamples > 0;
}
