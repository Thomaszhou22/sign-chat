import { useState, useEffect, useCallback } from 'react';
import type { Level, ASLSign } from '../data/curriculum';
import SignDiagram from './SignDiagram';

interface TestModeProps {
  level: Level;
  onBack: () => void;
}

interface TestResult {
  sign: string;
  correct: boolean;
  responseTime: number;
}

export default function TestMode({ level, onBack }: TestModeProps) {
  const [currentSign, setCurrentSign] = useState<ASLSign | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isFinished, setIsFinished] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [usedSigns, setUsedSigns] = useState<string[]>([]);

  const pickRandomSign = useCallback(() => {
    const available = level.signs.filter(s => !usedSigns.includes(s.label));
    if (available.length === 0) {
      setIsFinished(true);
      return;
    }
    const sign = available[Math.floor(Math.random() * available.length)];
    setCurrentSign(sign);
    setUsedSigns([...usedSigns, sign.label]);
    setStartTime(Date.now());
    setShowAnswer(false);
  }, [level.signs, usedSigns]);

  useEffect(() => {
    pickRandomSign();
  }, [pickRandomSign]);

  useEffect(() => {
    if (isFinished) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsFinished(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished]);

  const handleAnswer = (correct: boolean) => {
    if (!currentSign) return;
    
    const responseTime = Date.now() - startTime;
    setResults([...results, {
      sign: currentSign.label,
      correct,
      responseTime
    }]);

    if (correct) {
      playVoice(currentSign.label);
    }

    setTimeout(() => pickRandomSign(), 1000);
  };

  const playVoice = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const calculateWPM = () => {
    const correctAnswers = results.filter(r => r.correct).length;
    const totalTime = (60 - timeLeft) / 60; // in minutes
    return totalTime > 0 ? Math.round(correctAnswers / totalTime) : 0;
  };

  const calculateAccuracy = () => {
    if (results.length === 0) return 0;
    const correct = results.filter(r => r.correct).length;
    return Math.round((correct / results.length) * 100);
  };

  if (isFinished) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-6">Test Complete!</h2>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-4xl font-bold text-cyan-400">{results.length}</div>
              <div className="text-gray-400">Total Signs</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-4xl font-bold text-green-400">{calculateAccuracy()}%</div>
              <div className="text-gray-400">Accuracy</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-4xl font-bold text-yellow-400">{calculateWPM()}</div>
              <div className="text-gray-400">WPM</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-4xl font-bold text-purple-400">
                {results.filter(r => r.correct).length}
              </div>
              <div className="text-gray-400">Correct</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors"
            >
              Back to Lessons
            </button>
            <button
              onClick={() => {
                setResults([]);
                setUsedSigns([]);
                setTimeLeft(60);
                setIsFinished(false);
                pickRandomSign();
              }}
              className="flex-1 px-6 py-3 bg-cyan-600 rounded-xl hover:bg-cyan-500 transition-colors"
            >
              Try Again
            </button>
          </div>
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
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-yellow-400">
            {timeLeft}s
          </div>
          <div className="text-lg text-gray-400">
            {results.length} answered
          </div>
        </div>
      </div>

      {currentSign && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="text-center mb-8">
            <p className="text-gray-400 mb-4">Show this sign:</p>
            <div className="flex justify-center mb-6">
              <SignDiagram label={currentSign.label} description={currentSign.description} size="lg" />
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
              <div className="text-red-400 font-semibold">Missed</div>
              <div className="text-sm text-gray-400">Didn't know it</div>
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="flex-1 px-6 py-4 bg-green-900/30 border border-green-800 rounded-xl hover:bg-green-900/50 transition-colors"
            >
              <div className="text-green-400 font-semibold">Got it!</div>
              <div className="text-sm text-gray-400">Signed correctly</div>
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="text-gray-400">{usedSigns.length} / {level.signs.length}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all"
            style={{ width: `${(usedSigns.length / level.signs.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
