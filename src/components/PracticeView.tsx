import { useState, useCallback, useEffect } from 'react';
import type { Level } from '../data/curriculum';
import HandTracker from './HandTracker';
import SignImage from './SignImage';
import type { GestureResult } from '../lib/gestureRecognizer';

interface PracticeViewProps {
  level: Level;
  onUpdateProgress: (levelId: string, signLabel: string, type: 'completed' | 'mastered') => void;
  onStartTest: () => void;
  onStartReview: () => void;
}

export default function PracticeView({ level, onUpdateProgress, onStartTest, onStartReview }: PracticeViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSign, setCurrentSign] = useState(level.signs[0]);
  const [detectedGesture, setDetectedGesture] = useState<GestureResult | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [showHint, setShowHint] = useState(true);

  // Load mistakes from localStorage for tracking
  const [, setMistakes] = useState<{ sign: string; count: number; lastAttempt: number }[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem(`mistakes-${level.id}`);
    if (saved) setMistakes(JSON.parse(saved));
  }, [level.id]);

  const recordMistake = (signLabel: string) => {
    setMistakes(prev => {
      const existing = prev.find(m => m.sign === signLabel);
      let updated;
      if (existing) {
        updated = prev.map(m => m.sign === signLabel ? { ...m, count: m.count + 1, lastAttempt: Date.now() } : m);
      } else {
        updated = [...prev, { sign: signLabel, count: 1, lastAttempt: Date.now() }];
      }
      localStorage.setItem(`mistakes-${level.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const playVoice = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleGestureDetected = useCallback((result: GestureResult | null) => {
    setDetectedGesture(result);

    if (result && (result.category === 'letter' || result.category === 'number')) {
      const correct = result.label === currentSign.label;
      
      if (correct) {
        setFeedback('correct');
        setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
        onUpdateProgress(level.id, currentSign.label, 'mastered');
        playVoice(currentSign.label);

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
        recordMistake(currentSign.label);
        setTimeout(() => setFeedback(null), 1500);
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
            <div className={`rounded-xl p-4 border ${
              feedback === 'correct' ? 'bg-green-900/20 border-green-700' :
              feedback === 'wrong' ? 'bg-red-900/20 border-red-700' :
              'bg-gray-900 border-gray-800'
            }`}>
              <p className="text-sm text-gray-400 mb-2">Detected:</p>
              <div className={`text-3xl font-bold ${
                feedback === 'correct' ? 'text-green-400' :
                feedback === 'wrong' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {detectedGesture.label}
                {feedback === 'correct' && ' ✓'}
                {feedback === 'wrong' && ' ✗'}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-2">Show this sign:</p>
              <div className="flex justify-center mb-4">
                <SignImage label={currentSign.label} imageUrl={currentSign.imageUrl} size="lg" />
              </div>
              <p className="text-lg text-gray-300">{currentSign.description}</p>
            </div>

            {showHint && (
              <div className="border-t border-gray-800 pt-6">
                <p className="text-sm font-semibold text-gray-300 mb-3">How to sign:</p>
                <div className="space-y-2 mb-4">
                  {currentSign.keypoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-cyan-500 mt-1">•</span>
                      <span className="text-sm text-gray-400">{point}</span>
                    </div>
                  ))}
                </div>
                {currentSign.hints && currentSign.hints.length > 0 && (
                  <>
                    <p className="text-sm font-semibold text-yellow-400 mb-2">Tips:</p>
                    <div className="space-y-2">
                      {currentSign.hints.map((hint, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">💡</span>
                          <span className="text-sm text-yellow-200/80">{hint}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-4 py-3 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              ← Prev
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

          <div className="flex gap-3">
            <button
              onClick={onStartTest}
              className="flex-1 px-4 py-3 bg-purple-700 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Start Test
            </button>
            <button
              onClick={onStartReview}
              className="flex-1 px-4 py-3 bg-orange-700 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Review Mistakes
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
