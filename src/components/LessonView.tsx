import { useState, useCallback, useEffect } from 'react';
import type { Level, ASLSign } from '../data/curriculum';
import HandTracker from './HandTracker';
import SignImage from './SignImage';
import type { GestureResult } from '../lib/gestureRecognizer';

interface LessonViewProps {
  level: Level;
  progress: { completed: string[]; mastered: string[] };
  onUpdateProgress: (levelId: string, signLabel: string, type: 'completed' | 'mastered') => void;
  onToggleCompleted: (levelId: string, signLabel: string) => void;
  onStartPractice: () => void;
  onStartTest: () => void;
  onStartReview: () => void;
  onStartCollect: () => void;
}

export default function LessonView({ level, progress, onUpdateProgress, onToggleCompleted, onStartPractice, onStartTest, onStartReview, onStartCollect }: LessonViewProps) {
  const [selectedSign, setSelectedSign] = useState<ASLSign | null>(null);
  const [detectedGesture, setDetectedGesture] = useState<GestureResult | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [practiceAttempts, setPracticeAttempts] = useState(0);

  // Reset feedback when sign changes
  useEffect(() => {
    if (selectedSign) {
      setFeedback(null);
      setPracticeAttempts(0);
    }
  }, [selectedSign]);

  const handleGestureDetected = useCallback((result: GestureResult | null) => {
    if (!selectedSign || feedback) return;

    setDetectedGesture(result);

    if (result && (result.category === 'letter' || result.category === 'number')) {
      const correct = result.label === selectedSign.label;
      
      if (correct) {
        setFeedback('correct');
        onUpdateProgress(level.id, selectedSign.label, 'mastered');
        
        // Auto-advance after 2 seconds
        setTimeout(() => {
          const currentIndex = level.signs.findIndex(s => s.label === selectedSign.label);
          if (currentIndex < level.signs.length - 1) {
            setSelectedSign(level.signs[currentIndex + 1]);
          }
        }, 2000);
      } else {
        setFeedback('wrong');
        setPracticeAttempts(prev => prev + 1);
        
        // Clear feedback after 1.5 seconds
        setTimeout(() => {
          setFeedback(null);
        }, 1500);
      }
    }
  }, [selectedSign, feedback, level, onUpdateProgress]);

  const handleBackToList = () => {
    setSelectedSign(null);
    setFeedback(null);
  };

  // Grid view
  if (!selectedSign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{level.name}</h2>
          <div className="flex gap-3">
            <button
              onClick={onStartCollect}
              className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 transition-colors"
            >
              🎯 Train Model
            </button>
            <button
              onClick={onStartPractice}
              className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
            >
              Practice Mode
            </button>
            <button
              onClick={onStartTest}
              className="px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
            >
              Take Test
            </button>
            <button
              onClick={onStartReview}
              className="px-4 py-2 bg-orange-600 rounded-lg hover:bg-orange-500 transition-colors"
            >
              Review Mistakes
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {level.signs.map((sign) => {
            const isMastered = progress.mastered.includes(sign.label);
            const isCompleted = progress.completed.includes(sign.label);

            return (
              <button
                key={sign.label}
                onClick={() => setSelectedSign(sign)}
                className={`p-6 rounded-xl text-left transition-all hover:scale-105 ${
                  isMastered
                    ? 'bg-green-900/20 border-2 border-green-700'
                    : isCompleted
                    ? 'bg-gray-800 border-2 border-gray-600'
                    : 'bg-gray-900 border-2 border-gray-800'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <SignImage label={sign.label} imageUrl={sign.imageUrl} size="sm" />
                  <span className="text-lg font-bold">{sign.label}</span>
                  {isMastered && (
                    <span className="text-green-500 text-sm">✓ Mastered</span>
                  )}
                  {isCompleted && !isMastered && (
                    <span className="text-gray-400 text-sm">Studied</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Detail view with practice
  const isMastered = progress.mastered.includes(selectedSign.label);
  const isCompleted = progress.completed.includes(selectedSign.label);
  const currentIndex = level.signs.findIndex(s => s.label === selectedSign.label);

  return (
    <div className="space-y-6">
      <button
        onClick={handleBackToList}
        className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
      >
        ← Back to List
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Sign info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-center mb-6">
            <SignImage label={selectedSign.label} imageUrl={selectedSign.imageUrl} size="lg" />
          </div>

          <div className="text-center">
            <h2 className="text-6xl font-bold text-cyan-400 mb-4">{selectedSign.label}</h2>
            <p className="text-xl text-gray-300">{selectedSign.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Key Points:</h3>
            <div className="space-y-3">
              {selectedSign.keypoints.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-cyan-500 text-xl">•</span>
                  <span className="text-gray-300">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedSign.hints && selectedSign.hints.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">Tips:</h3>
              <div className="space-y-3">
                {selectedSign.hints.map((hint, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-yellow-500 text-xl">💡</span>
                    <span className="text-yellow-200/80">{hint}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {currentIndex > 0 && (
              <button
                onClick={() => setSelectedSign(level.signs[currentIndex - 1])}
                className="flex-1 px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Previous
              </button>
            )}
            
            {!isMastered && (
              <button
                onClick={() => onToggleCompleted(level.id, selectedSign.label)}
                className={`flex-1 px-6 py-3 rounded-lg transition-colors ${
                  isCompleted
                    ? 'bg-gray-600 hover:bg-gray-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {isCompleted ? 'Cancel Studied' : 'Mark as Studied'}
              </button>
            )}

            {currentIndex < level.signs.length - 1 && (
              <button
                onClick={() => setSelectedSign(level.signs[currentIndex + 1])}
                className="flex-1 px-6 py-3 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        </div>

        {/* Right: Practice area */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Practice This Sign</h3>
            <p className="text-gray-400 mb-4">Show the sign to your camera to practice</p>

            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-800 mb-4">
              <HandTracker
                onGesture={handleGestureDetected}
                onHandDetected={setHandDetected}
                levelId={level.id}
              />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${handDetected ? 'bg-green-500' : 'bg-gray-600'}`} />
              <span className="text-sm text-gray-400">
                {handDetected ? 'Hand detected' : 'Show your hand to camera'}
              </span>
            </div>

            {detectedGesture && (
              <div className={`rounded-xl p-4 border ${
                feedback === 'correct' ? 'bg-green-900/20 border-green-700' :
                feedback === 'wrong' ? 'bg-red-900/20 border-red-700' :
                'bg-gray-800 border-gray-700'
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

            {practiceAttempts > 0 && !isMastered && (
              <div className="mt-4 text-sm text-gray-400">
                Attempts: {practiceAttempts}
              </div>
            )}

            {isMastered && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-xl">
                <p className="text-green-400 font-semibold">✓ You've mastered this sign!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
