import { useState, useEffect } from 'react';
import type { Level, ASLSign } from '../data/curriculum';

interface ReviewModeProps {
  level: Level;
  onBack: () => void;
}

interface Mistake {
  sign: string;
  count: number;
  lastAttempt: number;
}

export default function ReviewMode({ level, onBack }: ReviewModeProps) {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ sign: string; correct: boolean }[]>([]);

  useEffect(() => {
    // Load mistakes from localStorage
    const saved = localStorage.getItem(`mistakes-${level.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Filter to only include signs from current level
      const levelSigns = level.signs.map(s => s.label);
      const filtered = parsed.filter((m: Mistake) => levelSigns.includes(m.sign));
      setMistakes(filtered);
    }
  }, [level.id, level.signs]);

  const currentSign: ASLSign | null = mistakes.length > 0 && currentIndex < mistakes.length
    ? level.signs.find(s => s.label === mistakes[currentIndex].sign) || null
    : null;

  const handleAnswer = (correct: boolean) => {
    if (!currentSign) return;

    const newResults = [...sessionResults, { sign: currentSign.label, correct }];
    setSessionResults(newResults);

    if (correct) {
      playVoice(currentSign.label);
      
      // Remove from mistakes if got it right 3 times in a row
      const signResults = newResults.filter(r => r.sign === currentSign.label);
      const lastThree = signResults.slice(-3);
      if (lastThree.length === 3 && lastThree.every(r => r.correct)) {
        const updated = mistakes.filter(m => m.sign !== currentSign.label);
        setMistakes(updated);
        localStorage.setItem(`mistakes-${level.id}`, JSON.stringify(updated));
      }
    } else {
      // Increment mistake count
      const updated = mistakes.map(m =>
        m.sign === currentSign.label
          ? { ...m, count: m.count + 1, lastAttempt: Date.now() }
          : m
      );
      setMistakes(updated);
      localStorage.setItem(`mistakes-${level.id}`, JSON.stringify(updated));
    }

    setShowAnswer(false);
    
    // Move to next sign or loop back
    setTimeout(() => {
      if (currentIndex < mistakes.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
    }, 1000);
  };

  const playVoice = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  if (mistakes.length === 0) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-4">No Mistakes to Review!</h2>
          <p className="text-gray-400 mb-8">
            You've mastered all signs in this level. Take a test to find areas for improvement.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-cyan-600 rounded-xl hover:bg-cyan-500 transition-colors"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="text-lg text-gray-400">
          {mistakes.length} signs to review
        </div>
      </div>

      {currentSign && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="text-center mb-8">
            <p className="text-gray-400 mb-4">Practice this sign:</p>
            <div className="text-9xl font-bold mb-6 text-yellow-400">
              {currentSign.label}
            </div>
            
            {showAnswer ? (
              <div className="space-y-4">
                <p className="text-xl text-gray-300">{currentSign.description}</p>
                <div className="text-left max-w-md mx-auto">
                  {currentSign.keypoints.map((point, i) => (
                    <div key={i} className="text-sm text-gray-400 mb-1">
                      • {point}
                    </div>
                  ))}
                  {currentSign.hints && currentSign.hints.map((hint, i) => (
                    <div key={`hint-${i}`} className="text-sm text-cyan-400 mb-1 mt-2">
                      💡 {hint}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-500 mt-4">
                  Mistake count: {mistakes[currentIndex].count}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAnswer(true)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Show Answer
              </button>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleAnswer(false)}
              className="flex-1 px-6 py-4 bg-red-900/30 border border-red-800 rounded-xl hover:bg-red-900/50 transition-colors"
            >
              <div className="text-red-400 font-semibold">Still Learning</div>
              <div className="text-sm text-gray-400">Need more practice</div>
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="flex-1 px-6 py-4 bg-green-900/30 border border-green-800 rounded-xl hover:bg-green-900/50 transition-colors"
            >
              <div className="text-green-400 font-semibold">Got it!</div>
              <div className="text-sm text-gray-400">3 correct = mastered</div>
            </button>
          </div>
        </div>
      )}

      {sessionResults.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Session Progress</h3>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-green-400">
              ✓ {sessionResults.filter(r => r.correct).length} correct
            </span>
            <span className="text-red-400">
              ✗ {sessionResults.filter(r => !r.correct).length} incorrect
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{
                width: `${(sessionResults.filter(r => r.correct).length / sessionResults.length) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
