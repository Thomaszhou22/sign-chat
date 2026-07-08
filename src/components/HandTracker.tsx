import { useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import type { GestureRecognizerResult } from '@mediapipe/tasks-vision';
import { analyzeHand, classifyGesture } from '../lib/gestureRecognizer';
import type { GestureResult } from '../lib/gestureRecognizer';

interface HandTrackerProps {
  onGesture: (result: GestureResult | null) => void;
  onHandDetected: (detected: boolean) => void;
  levelId?: string;
}

let gestureRecognizer: GestureRecognizer | null = null;
let lastVideoTime = -1;

async function initGestureRecognizer(): Promise<GestureRecognizer> {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  return GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.7,
    minHandPresenceConfidence: 0.7,
    minTrackingConfidence: 0.5
  });
}

export default function HandTracker({ onGesture, onHandDetected, levelId }: HandTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastGestureRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);
  const STABLE_THRESHOLD = 2;

  const drawLandmarks = useCallback((results: GestureRecognizerResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.landmarks || results.landmarks.length === 0) return;

    const landmarks = results.landmarks[0];
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17],
    ];

    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    connections.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * canvas.width, landmarks[a].y * canvas.height);
      ctx.lineTo(landmarks[b].x * canvas.width, landmarks[b].y * canvas.height);
      ctx.stroke();
    });

    landmarks.forEach((lm, i) => {
      ctx.beginPath();
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, i % 4 === 0 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = [0, 4, 8, 12, 16, 20].includes(i) ? '#ef4444' : '#22d3ee';
      ctx.fill();
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
          lastGestureRef.current = null;
          stableCountRef.current = 0;
          onGesture(null);
        } else {
          onHandDetected(true);
          const landmarks = results.landmarks[0];
          const handedness = results.handednesses[0]?.[0]?.categoryName === 'Left' ? 'right' : 'left';
          const hand = analyzeHand(landmarks, handedness);
          const customResult = classifyGesture(hand, levelId);
          const builtIn = results.gestures[0]?.[0];

          let result: GestureResult | null = null;
          if (builtIn && builtIn.categoryName !== 'None' && builtIn.score > 0.7) {
            result = { label: builtIn.categoryName, category: 'phrase', confidence: builtIn.score };
          } else if (customResult) {
            result = customResult;
          }

          if (result) {
            if (result.label === lastGestureRef.current) {
              stableCountRef.current++;
              if (stableCountRef.current >= STABLE_THRESHOLD) {
                onGesture(result);
              }
            } else {
              lastGestureRef.current = result.label;
              stableCountRef.current = 1;
            }
          } else {
            lastGestureRef.current = null;
            stableCountRef.current = 0;
            onGesture(null);
          }
        }
      }

      if (mounted) animationFrameId = window.requestAnimationFrame(predictWebcam);
    };

    const init = async () => {
      try {
        gestureRecognizer = await initGestureRecognizer();
        if (!mounted) return;
        if (videoRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => predictWebcam());
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    init();
    return () => {
      mounted = false;
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [drawLandmarks, onGesture, onHandDetected, levelId]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover rounded-2xl"
        style={{ transform: 'scaleX(-1)' }}
        autoPlay playsInline muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded-2xl"
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  );
}
