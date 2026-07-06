declare module '@mediapipe/hands' {
  export interface Results {
    multiHandLandmarks?: Array<Array<{ x: number; y: number; z: number }>>;
    multiHandedness?: Array<{ label: string; score: number }>;
  }

  export interface Options {
    maxNumHands?: number;
    modelComplexity?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export class Hands {
    constructor(config: { locateFile: (file: string) => string });
    setOptions(options: Options): void;
    onResults(callback: (results: Results) => void): void;
    send(input: { image: HTMLVideoElement }): Promise<void>;
    close(): void;
  }
}

declare module '@mediapipe/camera_utils' {
  export interface CameraOptions {
    onFrame: () => Promise<void>;
    width?: number;
    height?: number;
  }

  export class Camera {
    constructor(video: HTMLVideoElement, options: CameraOptions);
    start(): Promise<void>;
    stop(): void;
  }
}

declare module '@mediapipe/drawing_utils' {
  export function drawConnectors(
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number; z: number }>,
    connections: Array<[number, number]>,
    style?: { color?: string; lineWidth?: number }
  ): void;

  export function drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number; z: number }>,
    style?: { color?: string; lineWidth?: number; radius?: number }
  ): void;
}
