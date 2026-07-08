import { useState, useCallback, useEffect, useRef } from 'react';
import type { Level } from '../data/curriculum';
import HandTracker from './HandTracker';
import SignImage from './SignImage';
import type { GestureResult } from '../lib/gestureRecognizer';
import { addTrainingSample, clearTrainingData, getTrainingStats, syncLocalToCloud } from '../lib/knnClassifier';
import { uploadSample, isCloudEnabled, getCloudStats, undoLastUpload } from '../lib/trainingApi';

interface DataCollectorProps {
  level: Level;
  onBack: () => void;
}

export default function DataCollector({ level, onBack }: DataCollectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'ready' | 'recording' | 'success'>('ready');
  const [message, setMessage] = useState('Click "Start Recording" and hold the sign');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [cloudStats, setCloudStats] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [handDetected, setHandDetected] = useState(false);
  const lastSampleTimeRef = useRef(0);

  const currentSign = level.signs[currentIndex];

  useEffect(() => {
    setStats(getTrainingStats());
    if (isCloudEnabled()) {
      getCloudStats().then(setCloudStats);
    }
  }, [level.id, status]);

  const handleGestureDetected = useCallback((_result: GestureResult | null) => {}, []);

  useEffect(() => {
    const handleLandmarksData = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.landmarks && isRecording) {
        const landmarks = customEvent.detail.landmarks;
        const now = Date.now();
        
        if (now - lastSampleTimeRef.current < 300) return;
        lastSampleTimeRef.current = now;

        addTrainingSample(currentSign.label, landmarks);
        const newStats = getTrainingStats();
        setStats(newStats);
        
        const count = newStats[currentSign.label] || 0;
        setStatus('success');
        setMessage(`Recorded ${count} samples`);

        // Note: Cloud upload is manual via "Sync to Cloud" button

        if (count >= 15) {
          stopRecording();
          setMessage(`"${currentSign.label}" collected ${count} samples. Ready for next!`);
        }
      }
    };

    window.addEventListener('landmarks-data', handleLandmarksData as EventListener);
    return () => window.removeEventListener('landmarks-data', handleLandmarksData as EventListener);
  }, [isRecording, currentSign]);

  const startRecording = () => {
    setIsRecording(true);
    setStatus('recording');
    setMessage('Recording... Hold the sign steady, you can adjust angle slightly');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatus('ready');
  };

  const handleNext = () => {
    if (currentIndex < level.signs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setStatus('ready');
      setMessage('Click "Start Recording" and hold the sign');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setStatus('ready');
      setMessage('Click "Start Recording" and hold the sign');
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all training data? This will reset the k-NN model.')) {
      clearTrainingData();
      setStats({});
      setMessage('All training data cleared');
    }
  };

  const getSampleCount = (label: string) => stats[label] || 0;

  const handleUndoUpload = async () => {
    setUploadStatus('Undoing last upload...');
    const result = await undoLastUpload();
    if (result.success) {
      setUploadStatus(`✓ Removed last upload (${result.deletedLabel})`);
      getCloudStats().then(setCloudStats);
    } else {
      setUploadStatus(`✗ ${result.reason}`);
    }
  };

  const totalSamples = Object.values(stats).reduce((a, b) => a + b, 0);
  const totalCloudSamples = Object.values(cloudStats).reduce((a, b) => a + b, 0);
  const hasData = totalSamples > 0 || totalCloudSamples > 0;

  // Simple local normalize for cloud upload
  function normalizeLocally(landmarks: any[]): number[] {
    if (!landmarks || landmarks.length < 21) return [];
    const wrist = landmarks[0];
    let maxDist = 0;
    for (const lm of landmarks) {
      const d = Math.sqrt((lm.x - wrist.x) ** 2 + (lm.y - wrist.y) ** 2 + (lm.z - wrist.z) ** 2);
      if (d > maxDist) maxDist = d;
    }
    if (maxDist < 0.001) maxDist = 0.001;
    const out: number[] = [];
    for (const lm of landmarks) {
      out.push((lm.x - wrist.x) / maxDist);
      out.push((lm.y - wrist.y) / maxDist);
      out.push((lm.z - wrist.z) / maxDist);
    }
    return out;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          {hasData && (
            <span className="text-sm text-green-400">
              ✓ k-NN model active (local: {totalSamples}, cloud: {totalCloudSamples})
            </span>
          )}
          {isCloudEnabled() && (
            <>
              <button
                onClick={async () => {
                  setUploadStatus('Syncing to cloud...');
                  const result = await syncLocalToCloud();
                  setUploadStatus(`Synced: ${result.uploaded} uploaded, ${result.flagged} flagged, ${result.failed} failed`);
                  getCloudStats().then(setCloudStats);
                }}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors text-sm"
              >
                Sync to Cloud
              </button>
              <button
                onClick={handleUndoUpload}
                className="px-4 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-500 transition-colors text-sm"
              >
                Undo Last Upload
              </button>
            </>
          )}
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition-colors text-sm"
            disabled={!hasData}
          >
            Clear Training Data
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Training Data Collection</h2>
        <p className="text-gray-400 mb-6">
          Record 15 samples for each sign. The k-NN classifier will use these samples to recognize your gestures.
          Face the camera, make accurate signs, and vary angle/distance slightly for robustness.
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Camera */}
          <div>
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-800 mb-4">
              <HandTracker
                onGesture={handleGestureDetected}
                onHandDetected={setHandDetected}
                levelId={level.id}
              />
            </div>

            <div className={`rounded-xl p-4 border ${
              status === 'recording' ? 'bg-red-900/20 border-red-700' :
              status === 'success' ? 'bg-green-900/20 border-green-700' :
              'bg-gray-800 border-gray-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${handDetected ? 'bg-green-500' : 'bg-gray-600'}`} />
                <span className="text-sm text-gray-400">
                  {handDetected ? 'Hand detected' : 'Show your hand to camera'}
                </span>
              </div>
              <p className={`text-lg font-semibold ${
                status === 'recording' ? 'text-red-400' :
                status === 'success' ? 'text-green-400' :
                'text-gray-300'
              }`}>
                {message}
              </p>
              {uploadStatus && (
                <p className="text-xs text-gray-500 mt-1">{uploadStatus}</p>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-400 mb-2">Current sign:</p>
                <div className="flex justify-center mb-4">
                  <SignImage label={currentSign.label} imageUrl={currentSign.imageUrl} size="md" />
                </div>
                <div className="text-5xl font-bold text-cyan-400 mb-2">{currentSign.label}</div>
                <p className="text-gray-300">{currentSign.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Samples recorded</span>
                  <span className="text-sm font-semibold text-cyan-400">
                    {getSampleCount(currentSign.label)} / 15
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all"
                    style={{ width: `${Math.min((getSampleCount(currentSign.label) / 15) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex-1 px-6 py-3 bg-red-600 rounded-lg hover:bg-red-500 transition-colors font-semibold"
                    disabled={!handDetected}
                  >
                    {handDetected ? '🎥 Start Recording' : 'Show your hand first'}
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex-1 px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                  >
                    ⏹ Stop Recording
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="flex-1 px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === level.signs.length - 1}
                  className="flex-1 px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-300">Collection Progress</h3>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {level.signs.map((sign) => {
                  const count = getSampleCount(sign.label);
                  return (
                    <div
                      key={sign.label}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        sign.label === currentSign.label
                          ? 'bg-cyan-900/30 border border-cyan-700'
                          : count >= 15
                          ? 'bg-green-900/20 border border-green-800'
                          : count > 0
                          ? 'bg-yellow-900/20 border border-yellow-800'
                          : 'bg-gray-700 border border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{sign.label}</span>
                        <span className={`text-xs ${count >= 15 ? 'text-green-400' : count > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {count}/15
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Instructions</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Record 15 samples per sign to activate the k-NN model</li>
          <li>• Samples are saved locally and uploaded to cloud (shared with all users)</li>
          <li>• Outlier detection prevents bad data: samples too different from existing data are rejected</li>
          <li>• Cross-label check: if your sample looks like a different sign, it gets flagged</li>
          <li>• Cloud data from all users improves recognition for everyone</li>
          <li>• Total: local {totalSamples} / cloud {totalCloudSamples} samples</li>
        </ul>
      </div>
    </div>
  );
}
