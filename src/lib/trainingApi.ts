// Cloud training data API via Supabase
// All users contribute to and benefit from a shared training dataset

import { createClient } from '@supabase/supabase-js';
import type { TrainingSample } from './storage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Generate anonymous user hash (not PII, just to limit duplicate submissions)
function getUserHash(): string {
  let hash = localStorage.getItem('asl-user-hash');
  if (!hash) {
    hash = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('asl-user-hash', hash);
  }
  return hash;
}

// Check if Supabase is configured
export function isCloudEnabled(): boolean {
  return supabase !== null;
}

// Upload a single training sample to cloud
export async function uploadSample(
  label: string,
  landmarks: number[]
): Promise<{ success: boolean; flagged: boolean; reason?: string }> {
  if (!supabase) return { success: false, flagged: false, reason: 'Cloud not configured' };

  // 1. Outlier detection BEFORE uploading
  const outlierCheck = await checkOutlier(label, landmarks);
  if (outlierCheck.isOutlier) {
    return {
      success: false,
      flagged: true,
      reason: outlierCheck.reason,
    };
  }

  // 2. Upload
  const sb = supabase!;
  const { error } = await sb.from('asl_training_samples').insert({
    label,
    landmarks,
    user_hash: getUserHash(),
    is_flagged: false,
  });

  if (error) {
    return { success: false, flagged: false, reason: error.message };
  }

  return { success: true, flagged: false };
}

// Fetch training samples for specific labels from cloud
export async function fetchCloudSamples(
  labels: string[]
): Promise<TrainingSample[]> {
  if (!supabase) return [];

  const sb = supabase!;
  const { data, error } = await sb
    .from('asl_training_samples')
    .select('label, landmarks, created_at')
    .in('label', labels)
    .eq('is_flagged', false)
    .order('created_at', { ascending: false })
    .limit(500); // cap to prevent huge downloads

  if (error || !data) return [];

  return data.map((row: any) => ({
    label: row.label,
    landmarks: row.landmarks,
    timestamp: new Date(row.created_at).getTime(),
  }));
}

// Fetch all training samples (for a specific level)
export async function fetchAllCloudSamples(): Promise<TrainingSample[]> {
  if (!supabase) return [];

  const sb = supabase!;
  const { data, error } = await sb
    .from('asl_training_samples')
    .select('label, landmarks, created_at')
    .eq('is_flagged', false)
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error || !data) return [];

  return data.map((row: any) => ({
    label: row.label,
    landmarks: row.landmarks,
    timestamp: new Date(row.created_at).getTime(),
  }));
}

// Get cloud stats (sample count per label)
export async function getCloudStats(): Promise<Record<string, number>> {
  if (!supabase) return {};

  const sb = supabase!;
  const { data, error } = await sb
    .from('asl_training_samples')
    .select('label')
    .eq('is_flagged', false);

  if (error || !data) return {};

  const stats: Record<string, number> = {};
  for (const row of data) {
    stats[row.label] = (stats[row.label] || 0) + 1;
  }
  return stats;
}

// ===== Outlier Detection =====
// Checks if a new sample is suspiciously different from existing data

interface OutlierResult {
  isOutlier: boolean;
  reason?: string;
  distance?: number;
  threshold?: number;
}

async function checkOutlier(
  label: string,
  newSample: number[]
): Promise<OutlierResult> {
  // Fetch existing samples for this label (up to 50 recent)
  const sb2 = supabase!;
  const { data, error } = await sb2
    .from('asl_training_samples')
    .select('landmarks')
    .eq('label', label)
    .eq('is_flagged', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data || data.length < 5) {
    // Not enough data to check — accept
    return { isOutlier: false };
  }

  const existingSamples = data.map((row: any) => row.landmarks as number[]);

  // 1. Check distance to same-label samples
  const distances = existingSamples.map(s => euclideanDistance(newSample, s));
  const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
  const stdDist = Math.sqrt(
    distances.reduce((sum, d) => sum + (d - avgDist) ** 2, 0) / distances.length
  );

  // If distance > avg + 3*std, it's an outlier
  const threshold = avgDist + 3 * stdDist;
  const newAvgDist = distances.reduce((a, b) => a + b, 0) / distances.length;

  if (newAvgDist > threshold) {
    return {
      isOutlier: true,
      reason: `Sample too different from existing "${label}" data (distance ${newAvgDist.toFixed(3)} > threshold ${threshold.toFixed(3)})`,
      distance: newAvgDist,
      threshold,
    };
  }

  // 2. Cross-label check: is this sample closer to a different label?
  // Fetch a few samples from other labels
  const sb3 = supabase!;
  const { data: otherData } = await sb3
    .from('asl_training_samples')
    .select('label, landmarks')
    .neq('label', label)
    .eq('is_flagged', false)
    .order('created_at', { ascending: false })
    .limit(100);

  if (otherData && otherData.length > 0) {
    // Group by label and compute centroids
    const labelGroups: Record<string, number[][]> = {};
    for (const row of otherData) {
      if (!labelGroups[row.label]) labelGroups[row.label] = [];
      labelGroups[row.label].push(row.landmarks);
    }

    // Find the closest other-label centroid
    let minOtherDist = Infinity;
    let closestOtherLabel = '';
    for (const [otherLabel, samples] of Object.entries(labelGroups)) {
      if (samples.length < 3) continue;
      const centroid = computeCentroid(samples);
      const dist = euclideanDistance(newSample, centroid);
      if (dist < minOtherDist) {
        minOtherDist = dist;
        closestOtherLabel = otherLabel;
      }
    }

    // Compute distance to own-label centroid
    const ownCentroid = computeCentroid(existingSamples);
    const ownDist = euclideanDistance(newSample, ownCentroid);

    // If sample is closer to a different label than its own, flag it
    if (minOtherDist < ownDist * 0.7 && closestOtherLabel) {
      return {
        isOutlier: true,
        reason: `Sample looks more like "${closestOtherLabel}" than "${label}" (own dist: ${ownDist.toFixed(3)}, other dist: ${minOtherDist.toFixed(3)})`,
        distance: ownDist,
        threshold: minOtherDist,
      };
    }
  }

  return { isOutlier: false };
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function computeCentroid(samples: number[][]): number[] {
  if (samples.length === 0) return [];
  const dim = samples[0].length;
  const centroid = new Array(dim).fill(0);
  for (const s of samples) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += s[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    centroid[i] /= samples.length;
  }
  return centroid;
}

// Flag a sample as bad (community moderation)
export async function flagSample(sampleId: number, reason: string): Promise<boolean> {
  if (!supabase) return false;

  const sb4 = supabase!;
  const { error } = await sb4
    .from('asl_training_samples')
    .update({ is_flagged: true, flag_reason: reason })
    .eq('id', sampleId);

  return !error;
}
