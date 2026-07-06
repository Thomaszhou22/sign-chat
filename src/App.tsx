import { useState, useCallback, useRef } from 'react';
import HandTracker from './components/HandTracker';
import type { GestureResult } from './lib/gestureRecognizer';

const SUPPORTED_GESTURES = [
  { group: 'Sign Hand (Right)', items: ['A-Z letters', '0-9 numbers'] },
  { group: 'Control Hand (Left)', items: ['Fist = Space (end word)', 'Open Palm = Delete'] },
  { group: 'Auto', items: ['Remove both hands 1.5s = end word'] },
  { group: 'Phrases (Sign Hand)', items: ['I Love You','OK','Good / Yes','Bad / No','Peace','Rock On','Call Me','Stop','Point'] },
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
  const [currentSign, setCurrentSign] = useState<GestureResult | null>(null);
  const [controlAction, setControlAction] = useState<'space' | 'delete' | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [sentence, setSentence] = useState('');
  const [history, setHistory] = useState<{ label: string; time: string; emoji?: string }[]>([]);
  const [showRef, setShowRef] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const lastSignRef = useRef<string | null>(null);
  const lastSignTimeRef = useRef<number>(0);
  const handLostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastControlRef = useRef<string | null>(null);
  const lastControlTimeRef = useRef<number>(0);
  const LETTER_COOLDOWN = 500;
  const CONTROL_COOLDOWN = 600;
  const WORD_TIMEOUT = 1500;

  const commitWord = useCallback(() => {
    setCurrentWord((word) => {
      if (word.length > 0) {
        setSentence((prev) => {
          const newSentence = prev ? prev + ' ' + word : word;
          if (autoSpeak) speak(word);
          return newSentence;
        });
        return '';
      }
      return word;
    });
  }, [autoSpeak]);

  const deleteLastLetter = useCallback(() => {
    setCurrentWord((word) => word.slice(0, -1));
  }, []);

  const addLetter = useCallback((letter: string) => {
    const now = Date.now();
    if (now - lastSignTimeRef.current < LETTER_COOLDOWN) return;
    if (letter === lastSignRef.current && now - lastSignTimeRef.current < 2000) return;

    lastSignRef.current = letter;
    lastSignTimeRef.current = now;

    setCurrentWord((word) => word + letter);

    setHistory((prev) => {
      const entry = {
        label: letter,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      return [entry, ...prev].slice(0, 50);
    });
  }, []);

  const onSignHand = useCallback(
    (result: GestureResult | null) => {
      setCurrentSign(result);

      if (result) {
        if (handLostTimerRef.current) {
          clearTimeout(handLostTimerRef.current);
          handLostTimerRef.current = null;
        }

        const label = result.label;

        if (result.category === 'letter' || result.category === 'number') {
          addLetter(label);
        } else if (result.category === 'phrase') {
          const now = Date.now();
          if (!lastSignRef.current || lastSignRef.current !== label || now - lastSignTimeRef.current > 3000) {
            lastSignRef.current = '__PHRASE__' + label;
            lastSignTimeRef.current = now;
            setSentence((prev) => {
              const sep = prev && !prev.endsWith(' ') ? ' ' : '';
              const newSentence = prev + sep + label;
              if (autoSpeak) speak(label);
              return newSentence;
            });
            setHistory((prev) => {
              const entry = {
                label,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                emoji: result.emoji,
              };
              return [entry, ...prev].slice(0, 50);
            });
          }
        }
      }
    },
    [addLetter, autoSpeak]
  );

  const onControlHand = useCallback(
    (action: 'space' | 'delete' | null) => {
      setControlAction(action);

      if (action) {
        const now = Date.now();
        if (action === lastControlRef.current && now - lastControlTimeRef.current < CONTROL_COOLDOWN) return;

        lastControlRef.current = action;
        lastControlTimeRef.current = now;

        if (action === 'space') {
          commitWord();
        } else if (action === 'delete') {
          deleteLastLetter();
        }
      } else {
        lastControlRef.current = null;
      }
    },
    [commitWord, deleteLastLetter]
  );

  const onHandDetected = useCallback(
    (detected: boolean) => {
      setHandDetected(detected);

      if (!detected) {
        if (!handLostTimerRef.current) {
          handLostTimerRef.current = setTimeout(() => {
            commitWord();
            handLostTimerRef.current = null;
            lastSignRef.current = null;
          }, WORD_TIMEOUT);
        }
      } else {
        if (handLostTimerRef.current) {
          clearTimeout(handLostTimerRef.current);
          handLostTimerRef.current = null;
        }
      }
    },
    [commitWord]
  );

  const clearAll = () => {
    setSentence('');
    setCurrentWord('');
    setHistory([]);
    lastSignRef.current = null;
  };

  const speakSentence = () => {
    const text = sentence + (currentWord ? ' ' + currentWord : '');
    if (text) speak(text);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SignChat</h1>
            <p className="text-sm text-gray-400 mt-1">
              Right hand spells letters. Left hand controls: fist = space, open palm = delete.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                autoSpeak ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'
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
        {/* Sentence output */}
        <div className="mb-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">Output</p>
            <div className="flex gap-2">
              {(sentence || currentWord) && (
                <button onClick={speakSentence} className="text-xs text-cyan-400 hover:text-cyan-300">
                  Read Aloud
                </button>
              )}
              {(sentence || currentWord) && (
                <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-300">
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="min-h-[3rem]">
            <span className="text-3xl font-light tracking-wide">
              {sentence}
              {sentence && currentWord ? ' ' : ''}
              <span className="text-cyan-400">{currentWord}</span>
              <span className="animate-pulse text-cyan-400">|</span>
            </span>
          </div>
        </div>

        <div className={`grid gap-6 ${showRef ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          {/* Camera */}
          <div className="lg:col-span-1">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
              <HandTracker
                onSignHand={onSignHand}
                onControlHand={onControlHand}
                onHandDetected={onHandDetected}
              />
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${handDetected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                <span className="text-sm text-gray-400">
                  {handDetected ? 'Hands detected' : 'No hands detected'}
                </span>
              </div>
              {controlAction && (
                <span className="text-sm text-amber-400 font-medium">
                  {controlAction === 'space' ? 'FIST: Space' : 'PALM: Delete'}
                </span>
              )}
            </div>
          </div>

          {/* Result + History */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Sign Hand</p>
              {currentSign ? (
                <div>
                  <div className="flex items-center gap-3">
                    {currentSign.emoji && <span className="text-4xl">{currentSign.emoji}</span>}
                    <span className="text-4xl font-bold">{currentSign.label}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <span className="text-sm text-gray-400">{currentSign.category}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-20 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all"
                          style={{ width: `${currentSign.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{Math.round(currentSign.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-lg">
                  {handDetected ? 'Recognizing...' : 'Show your right hand to spell'}
                </p>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Control Hand (Left)</p>
              <div className="flex gap-4">
                <div className={`px-4 py-2 rounded-lg ${controlAction === 'space' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                  Fist = Space
                </div>
                <div className={`px-4 py-2 rounded-lg ${controlAction === 'delete' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                  Palm = Delete
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">History</p>
                {history.length > 0 && (
                  <button onClick={() => setHistory([])} className="text-xs text-gray-500 hover:text-gray-300">
                    Clear
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-gray-600 text-sm">No letters recognized yet</p>
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
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">How to Use</p>
              <div className="space-y-4">
                {SUPPORTED_GESTURES.map((group) => (
                  <div key={group.group}>
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">{group.group}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <span key={item} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500">
                  The camera mirrors your image. Your right hand appears on the left side (labeled SIGN). Your left hand appears on the right side (labeled CTRL). Hold signs steady for half a second.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
