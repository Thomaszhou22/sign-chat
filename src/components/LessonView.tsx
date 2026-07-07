import { useState } from 'react';
import type { Level } from '../data/curriculum';

interface LessonViewProps {
  level: Level;
  progress: { completed: string[]; mastered: string[] };
  onUpdateProgress: (levelId: string, signLabel: string, type: 'completed' | 'mastered') => void;
  onStartPractice: () => void;
}

export default function LessonView({ level, progress, onUpdateProgress, onStartPractice }: LessonViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSign = level.signs[currentIndex];

  const handleNext = () => {
    if (currentIndex < level.signs.length - 1) {
      onUpdateProgress(level.id, currentSign.label, 'completed');
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleMarkMastered = () => {
    onUpdateProgress(level.id, currentSign.label, 'mastered');
  };

  const isMastered = progress.mastered.includes(currentSign.label);

  return (
    <div className="space-y-6">
      {/* Sign cards grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {level.signs.map((sign, idx) => (
          <button
            key={sign.label}
            onClick={() => setCurrentIndex(idx)}
            className={`p-4 rounded-xl text-left transition-all ${
              idx === currentIndex
                ? 'bg-cyan-900 border-2 border-cyan-500'
                : progress.mastered.includes(sign.label)
                ? 'bg-green-900/20 border border-green-800'
                : progress.completed.includes(sign.label)
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-gray-900 border border-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{sign.label}</span>
              {progress.mastered.includes(sign.label) && (
                <span className="text-green-500">✓</span>
              )}
            </div>
            <p className="text-sm text-gray-400">{sign.description}</p>
          </button>
        ))}
      </div>

      {/* Current sign detail */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-9xl font-bold mb-4 text-cyan-400">{currentSign.label}</div>
          <p className="text-xl text-gray-300">{currentSign.description}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Key Points:</h3>
          <div className="space-y-3">
            {currentSign.keypoints.map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-cyan-500 text-xl">•</span>
                <span className="text-gray-300">{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-3 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            ← Previous
          </button>

          <div className="flex gap-3">
            {!isMastered && (
              <button
                onClick={handleMarkMastered}
                className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-500 transition-colors"
              >
                Mark as Mastered
              </button>
            )}
            {currentIndex < level.signs.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onStartPractice}
                className="px-6 py-3 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
              >
                Start Practice Mode
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
