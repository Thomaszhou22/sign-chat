import { useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import type { GestureRecognizerResult } from '@mediapipe/tasks-vision';
import { analyzeHand, classifyGesture } from '../lib/gestureRecognizer';
import type { GestureResult } from '../lib/gestureRecognizer';

interface HandTrackerProps {
  onSignHand: (result: GestureResult | null) => void;
  onControlHand: (action: 'space' | 'delete' | null) => void;
  onHandDetected: (detected: boolean) => void;
}

let gestureRecognizer: GestureRecognizer | null = null;
let lastVideoTime = -1;

async function initGestureRecognizer(): Promise<GestureRecognizer> {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  const recognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.7,
    minHandPresenceConfidence: 0.7,
    minTrackingConfidence: 0.5
  });

  return recognizer;
}

export default function HandTracker({ onSignHand, onControlHand, onHandDetected }: HandTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastSignRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);
  const lastControlRef = useRef<string | null>(null);
  const controlStableRef = useRef(0);
  const STABLE_THRESHOLD = 8;

  const drawLandmarks = useCallback((results: GestureRecognizerResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.landmarks) return;

    results.landmarks.forEach((landmarks, handIdx) => {
      const handedness = results.handednesses[handIdx]?.[0]?.categoryName;
      const isSignHand = handedness === 'Left'; // Left in video = user's right hand
      const color = isSignHand ? '#22d3ee' : '#f59e0b';

      // Draw connections
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17],
      ];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      connections.forEach(([a, b]) => {
        const p1 = landmarks[a];
        const p2 = landmarks[b];
        ctx.beginPath();
        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
        ctx.stroke();
      });

      landmarks.forEach((lm, i) => {
        const x = lm.x * canvas.width;
        const y = lm.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, i % 4 === 0 ? 6 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      });

      // Label
      if (landmarks.length > 0) {
        const wrist = landmarks[0];
        ctx.font = '14px sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(
          isSignHand ? 'SIGN' : 'CTRL',
          wrist.x * canvas.width - 20,
          wrist.y * canvas.height + 25
        );
      }
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    let animationFrameId: number;

    const predictWebcam = async () => {
      if (!videoRef.current || !gestureRecognizer) {
        animationFrameId = window.requestAnimationFrame(predictWebcam);
        return;
      }

      const video = videoRef.current;
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;

        const results = await gestureRecognizer.recognizeForVideo(video, performance.now());

        drawLandmarks(results);

        if (!results.landmarks || results.landmarks.length === 0) {
          onHandDetected(false);
          lastSignRef.current = null;
          stableCountRef.current = 0;
          lastControlRef.current = null;
          controlStableRef.current = 0;
          onSignHand(null);
          return;
        }

        onHandDetected(true);

        let signHandResult: GestureResult | null = null;
        let controlAction: 'space' | 'delete' | null = null;

        results.landmarks.forEach((landmarks, handIdx) => {
          const handedness = results.handednesses[handIdx]?.[0]?.categoryName;
          // Camera mirrors: "Left" in MediaPipe = user's right hand (sign hand)
          const isSignHand = handedness === 'Left';

          if (isSignHand) {
            // Sign hand: classify letters/numbers
            const hand = analyzeHand(landmarks, 'right');
            const customResult = classifyGesture(hand);
            const builtIn = results.gestures[handIdx]?.[0];

            let result: GestureResult | null = null;
            if (builtIn && builtIn.categoryName !== 'None' && builtIn.score > 0.7) {
              result = {
                label: builtIn.categoryName,
                category: 'phrase',
                confidence: builtIn.score,
              };
            } else if (customResult) {
              result = customResult;
            }

            // Only accept letters and numbers for spelling
            if (result && (result.category === 'letter' || result.category === 'number')) {
              if (result.label === lastSignRef.current) {
                stableCountRef.current++;
                if (stableCountRef.current >= STABLE_THRESHOLD) {
                  signHandResult = result;
                }
              } else {
                lastSignRef.current = result.label;
                stableCountRef.current = 1;
              }
            } else {
              lastSignRef.current = null;
              stableCountRef.current = 0;
            }
          } else {
            // Control hand: fist = space, open palm = delete
            const hand = analyzeHand(landmarks, 'left');
            const fingers = hand.fingers;
            const allClosed = !fingers.thumb.extended && !fingers.index.extended && !fingers.middle.extended && !fingers.ring.extended && !fingers.pinky.extended;
            const allOpen = fingers.thumb.extended && fingers.index.extended && fingers.middle.extended && fingers.ring.extended && fingers.pinky.extended;

            let action: 'space' | 'delete' | null = null;
            if (allClosed) action = 'space';
            else if (allOpen) action = 'delete';

            if (action) {
              if (action === lastControlRef.current) {
                controlStableRef.current++;
                if (controlStableRef.current >= STABLE_THRESHOLD) {
                  controlAction = action;
                }
              } else {
                lastControlRef.current = action;
                controlStableRef.current = 1;
              }
            } else {
              lastControlRef.current = null;
              controlStableRef.current = 0;
            }
          }
        });

        onSignHand(signHandResult);
        onControlHand(controlAction);
      }

      if (mounted) {
        animationFrameId = window.requestAnimationFrame(predictWebcam);
      }
    };

    const init = async () => {
      try {
        gestureRecognizer = await initGestureRecognizer();

        if (!mounted) return;

        if (videoRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }
          });
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
            predictWebcam();
          });
        }
      } catch (error) {
        console.error('Failed to initialize gesture recognizer:', error);
      }
    };

    init();

    return () => {
      mounted = false;
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [drawLandmarks, onSignHand, onControlHand, onHandDetected]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover rounded-2xl"
        style={{ transform: 'scaleX(-1)' }}
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded-2xl"
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  );
}
