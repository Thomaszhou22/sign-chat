import { useState, useCallback, useRef } from 'react';
import HandTracker from './components/HandTracker';
import type { GestureResult } from './lib/gestureRecognizer';

const SUPPORTED_GESTURES = [
  { group: 'ASL Letters', items: ['A','B','C','D','E','F','G','H','I','J','K','L','O','R','S','U','V','W','Y'] },
  { group: 'Numbers', items: ['0','1','2','3','4','5','6','7','8','9'] },
  { group: 'Phrases', items: ['I Love You','OK','Good / Yes','Bad / No','Peace','Rock On','Call Me','Stop','Point'] },
];

function speak(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.lang = 'en-US';
    window.speechSynthesis.speak(u);
  }
}

export default function App() {
  const [currentGesture, setCurrentGesture] = useState<GestureResult | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [history, setHistory] = useState<{ label: string; time: string; emoji?: string }[]>([]);
  const [showRef, setShowRef] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const lastSpokenRef = useRef<{ label: string; time: number } | null>(null);

  const onGesture = useCallback(
    (result: GestureResult | null) => {
      setCurrentGesture(result);

      if (result) {
        const now = Date.now();
        const last = lastSpokenRef.current;
        const isDuplicate = last && last.label === result.label && now - last.time < 3000;

        if (!isDuplicate) {
          lastSpokenRef.current = { label: result.label, time: now };

          if (autoSpeak) {
            speak(result.label);
          }

          setHistory((prev) => {
            const entry = {
              label: result.label,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              emoji: result.emoji,
            };
            const next = [entry, ...prev];
            return next.slice(0, 50);
          });
        }
      }
    },
    [autoSpeak]
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              SignChat
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Real-time sign language translator. Show your hand to the camera.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                autoSpeak
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {autoSpeak ? 'Voice On' : 'Voice Off'}
            </button>
            <button
              onClick={() => setShowRef(!showRef)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              {showRef ? 'Hide Guide' : 'Gesture Guide'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className={`grid gap-6 ${showRef ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          {/* Camera */}
          <div className="lg:col-span-1">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
              <HandTracker
                onGesture={onGesture}
                onHandDetected={setHandDetected}
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  handDetected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'
                }`}
              />
              <span className="text-sm text-gray-400">
                {handDetected ? 'Hand detected' : 'No hand detected'}
              </span>
            </div>
          </div>

          {/* Result + History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current gesture */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                Detected
              </p>
              {currentGesture ? (
                <div>
                  <div className="flex items-center gap-3">
                    {currentGesture.emoji && (
                      <span className="text-4xl">{currentGesture.emoji}</span>
                    )}
                    <span className="text-4xl font-bold">{currentGesture.label}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <span className="text-sm text-gray-400">
                      {currentGesture.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-20 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all"
                          style={{ width: `${currentGesture.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(currentGesture.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-lg">
                  {handDetected ? 'Recognizing...' : 'Show a sign to begin'}
                </p>
              )}
            </div>

            {/* History */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  History
                </p>
                {history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="text-xs text-gray-500 hover:text-gray-300"
                  >
                    Clear
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-gray-600 text-sm">No gestures recognized yet</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {history.map((h, i) => (
                    <span
                      key={`${h.label}-${h.time}-${i}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 rounded-full text-sm"
                    >
                      {h.emoji && <span>{h.emoji}</span>}
                      <span>{h.label}</span>
                      <span className="text-gray-600 text-xs ml-1">{h.time}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gesture reference */}
          {showRef && (
            <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">
                Supported Gestures ({SUPPORTED_GESTURES.reduce((s, g) => s + g.items.length, 0)})
              </p>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {SUPPORTED_GESTURES.map((group) => (
                  <div key={group.group}>
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">
                      {group.group}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500">
                  Tip: Hold your hand steady for about half a second for the gesture to be recognized. Good lighting and a clear background help accuracy.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
