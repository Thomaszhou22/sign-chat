import { useState, useCallback } from 'react';
import type { Level } from '../data/curriculum';
import HandTracker from './HandTracker';
import type { GestureResult } from '../lib/gestureRecognizer';

interface PracticeViewProps {
  level: Level;
  progress: { completed: string[]; mastered: string[] };
  onUpdateProgress: (levelId: string, signLabel: string, type: 'completed' | 'mastered') => void;
}

export default function PracticeView({ level, onUpdateProgress }: PracticeViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSign, setCurrentSign] = useState(level.signs[0]);
  const [detectedGesture, setDetectedGesture] = useState<GestureResult | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [showHint, setShowHint] = useState(true);

  const handleGestureDetected = useCallback((result: GestureResult | null) => {
    setDetectedGesture(result);

    if (result && (result.category === 'letter' || result.category === 'number')) {
      const correct = result.label === currentSign.label;
      
      if (correct) {
        setFeedback('correct');
        setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
        onUpdateProgress(level.id, currentSign.label, 'mastered');

        setTimeout(() => {
          if (currentIndex < level.signs.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setCurrentSign(level.signs[nextIndex]);
            setFeedback(null);
          }
        }, 1500);
      } else {
        setFeedback('wrong');
        setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));
        setTimeout(() => setFeedback(null), 1000);
      }
    }
  }, [currentSign, currentIndex, level, onUpdateProgress]);

  const handleSkip = () => {
    if (currentIndex < level.signs.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentSign(level.signs[nextIndex]);
      setFeedback(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentSign(level.signs[prevIndex]);
      setFeedback(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Camera */}
        <div>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 mb-4">
            <HandTracker
              onGesture={handleGestureDetected}
              onHandDetected={setHandDetected}
            />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2.5 h-2.5 rounded-full ${handDetected ? 'bg-green-500' : 'bg-gray-600'}`} />
            <span className="text-sm text-gray-400">
              {handDetected ? 'Hand detected' : 'Show your hand'}
            </span>
          </div>

          {detectedGesture && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">Detected:</p>
              <div className={`text-3xl font-bold ${
                feedback === 'correct' ? 'text-green-500' :
                feedback === 'wrong' ? 'text-red-500' :
                'text-gray-400'
              }`}>
                {detectedGesture.label}
                {feedback === 'correct' && ' ✓'}
                {feedback === 'wrong' && ' ✗'}
              </div>
            </div>
          )}
        </div>

        {/* Right: Instruction */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-2">Show this sign:</p>
              <div className="text-8xl font-bold mb-4 text-cyan-400">{currentSign.label}</div>
              <p className="text-lg text-gray-300">{currentSign.description}</p>
            </div>

            {showHint && (
              <div className="border-t border-gray-800 pt-6">
                <p className="text-sm font-semibold text-gray-300 mb-3">Key Points:</p>
                <div className="space-y-2">
                  {currentSign.keypoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-cyan-500 mt-1">•</span>
                      <span className="text-sm text-gray-400">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-4 py-3 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => setShowHint(!showHint)}
              className="px-4 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showHint ? 'Hide Hints' : 'Show Hints'}
            </button>
            <button
              onClick={handleSkip}
              disabled={currentIndex === level.signs.length - 1}
              className="flex-1 px-4 py-3 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Skip →
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">Progress</p>
              <p className="text-sm text-gray-400">
                {currentIndex + 1} / {level.signs.length}
              </p>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${((currentIndex + 1) / level.signs.length) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-500">✓ {score.correct} correct</span>
              <span className="text-red-500">✗ {score.wrong} wrong</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
