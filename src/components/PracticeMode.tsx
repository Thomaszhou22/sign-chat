import { useState, useCallback } from 'react';
import type { ASLSign } from '../data/curriculum';
import HandTracker from './HandTracker';
import type { GestureResult } from '../lib/gestureRecognizer';

interface PracticeModeProps {
  signs: ASLSign[];
  onComplete: (results: PracticeResult[]) => void;
  onBack: () => void;
}

interface PracticeResult {
  sign: string;
  correct: boolean;
  attempts: number;
  timeSpent: number;
}

export default function PracticeMode({ signs, onComplete, onBack }: PracticeModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSign, setCurrentSign] = useState<ASLSign>(signs[0]);
  const [detectedGesture, setDetectedGesture] = useState<GestureResult | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(true);

  const handleGestureDetected = useCallback((result: GestureResult | null) => {
    setDetectedGesture(result);

    if (result && result.category === 'letter') {
      const correct = result.label === currentSign.label;
      setIsCorrect(correct);

      if (correct) {
        setResults(prev => [...prev, {
          sign: currentSign.label,
          correct: true,
          attempts: attempts + 1,
          timeSpent: Date.now() - startTime,
        }]);

        setTimeout(() => {
          if (currentIndex < signs.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setCurrentSign(signs[currentIndex + 1]);
            setIsCorrect(null);
            setAttempts(0);
            setStartTime(Date.now());
          } else {
            onComplete([...results, {
              sign: currentSign.label,
              correct: true,
              attempts: attempts + 1,
              timeSpent: Date.now() - startTime,
            }]);
          }
        }, 1500);
      } else {
        setAttempts(attempts + 1);
      }
    }
  }, [currentSign, currentIndex, signs, attempts, startTime, results, onComplete]);

  const handleSkip = () => {
    setResults(prev => [...prev, {
      sign: currentSign.label,
      correct: false,
      attempts: attempts,
      timeSpent: Date.now() - startTime,
    }]);

    if (currentIndex < signs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentSign(signs[currentIndex + 1]);
      setIsCorrect(null);
      setAttempts(0);
      setStartTime(Date.now());
    } else {
      onComplete([...results, {
        sign: currentSign.label,
        correct: false,
        attempts: attempts,
        timeSpent: Date.now() - startTime,
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold">Practice Mode</h1>
              <p className="text-sm text-gray-400">
                Sign {currentIndex + 1} of {signs.length}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHint(!showHint)}
            className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {showHint ? 'Hide Hints' : 'Show Hints'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Camera */}
          <div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 mb-4">
              <HandTracker
                onGesture={handleGestureDetected}
                onHandDetected={setHandDetected}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${handDetected ? 'bg-green-500' : 'bg-gray-600'}`} />
              <span className="text-sm text-gray-400">
                {handDetected ? 'Hand detected' : 'Show your hand'}
              </span>
            </div>
          </div>

          {/* Right: Instruction */}
          <div className="space-y-6">
            {/* Current sign */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-2">Show this sign:</p>
                <div className="text-8xl font-bold mb-4">{currentSign.label}</div>
                {detectedGesture && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Detected:</p>
                    <div className={`text-4xl font-bold ${
                      isCorrect === true ? 'text-green-500' :
                      isCorrect === false ? 'text-red-500' :
                      'text-gray-400'
                    }`}>
                      {detectedGesture.label}
                      {isCorrect === true && ' ✓'}
                      {isCorrect === false && ' ✗'}
                    </div>
                  </div>
                )}
              </div>

              {showHint && (
                <div className="border-t border-gray-800 pt-6">
                  <p className="text-sm font-semibold text-gray-300 mb-3">How to sign:</p>
                  <p className="text-gray-400 mb-4">{currentSign.description}</p>
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

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Skip
              </button>
            </div>

            {/* Progress */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">Progress</p>
                <p className="text-sm text-gray-400">
                  {results.filter(r => r.correct).length} / {results.length} correct
                </p>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${((currentIndex + 1) / signs.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
