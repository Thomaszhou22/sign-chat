// MediaPipe Hands landmark indices
// 0: wrist, 1-4: thumb, 5-8: index, 9-12: middle, 13-16: ring, 17-20: pinky
export const Landmarks = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FingerState {
  extended: boolean;
  angle: number; // curl angle (0 = straight, 90+ = curled)
}

export interface HandAnalysis {
  fingers: {
    thumb: FingerState;
    index: FingerState;
    middle: FingerState;
    ring: FingerState;
    pinky: FingerState;
  };
  palmFacing: 'camera' | 'away' | 'side';
  handedness: 'left' | 'right';
  landmarks: HandLandmark[];
  confidence: number;
}

// Helper: calculate distance between two landmarks
function dist(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

// Helper: calculate angle between three points (returns 0-180)
function angle(a: HandLandmark, b: HandLandmark, c: HandLandmark): number {
  const ab = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const cb = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2 + ab.z ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2 + cb.z ** 2);
  if (magAB === 0 || magCB === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

// Helper: check if finger is extended (tip above PIP in y, considering hand orientation)
function isFingerExtended(
  tip: HandLandmark,
  pip: HandLandmark,
  wrist: HandLandmark
): boolean {
  // Finger is extended if tip is further from wrist than PIP
  const tipDist = dist(tip, wrist);
  const pipDist = dist(pip, wrist);
  return tipDist > pipDist * 1.1;
}

// Helper: check if thumb is extended
function isThumbExtended(
  tip: HandLandmark,
  ip: HandLandmark,
  wrist: HandLandmark
): boolean {
  // Thumb extended if tip is far from palm center
  const tipToWrist = dist(tip, wrist);
  const ipToWrist = dist(ip, wrist);
  return tipToWrist > ipToWrist * 1.05;
}

// Analyze hand landmarks into structured state
export function analyzeHand(
  landmarks: HandLandmark[],
  handedness: 'left' | 'right'
): HandAnalysis {
  const w = landmarks[Landmarks.WRIST];

  // Analyze each finger
  const analyzeFinger = (
    tipIdx: number,
    pipIdx: number,
    mcpIdx: number
  ): FingerState => {
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    const mcp = landmarks[mcpIdx];

    const extended = isFingerExtended(tip, pip, w);
    const curlAngle = angle(mcp, pip, tip);

    return { extended, angle: curlAngle };
  };

  const thumb: FingerState = {
    extended: isThumbExtended(
      landmarks[Landmarks.THUMB_TIP],
      landmarks[Landmarks.THUMB_IP],
      w
    ),
    angle: angle(
      landmarks[Landmarks.THUMB_MCP],
      landmarks[Landmarks.THUMB_IP],
      landmarks[Landmarks.THUMB_TIP]
    ),
  };

  const index = analyzeFinger(
    Landmarks.INDEX_TIP,
    Landmarks.INDEX_PIP,
    Landmarks.INDEX_MCP
  );
  const middle = analyzeFinger(
    Landmarks.MIDDLE_TIP,
    Landmarks.MIDDLE_PIP,
    Landmarks.MIDDLE_MCP
  );
  const ring = analyzeFinger(
    Landmarks.RING_TIP,
    Landmarks.RING_PIP,
    Landmarks.RING_MCP
  );
  const pinky = analyzeFinger(
    Landmarks.PINKY_TIP,
    Landmarks.PINKY_PIP,
    Landmarks.PINKY_MCP
  );

  // Determine palm facing direction

  // Use z-depth difference to determine palm facing
  const indexMCP = landmarks[Landmarks.INDEX_MCP];
  const pinkyMCP = landmarks[Landmarks.PINKY_MCP];
  const zDiff = Math.abs(indexMCP.z - pinkyMCP.z);

  let palmFacing: 'camera' | 'away' | 'side' = 'camera';
  if (zDiff < 0.02) {
    // Check if fingers point towards or away from camera
    const avgFingerZ =
      (landmarks[Landmarks.INDEX_TIP].z + landmarks[Landmarks.MIDDLE_TIP].z) / 2;
    const palmZ = w.z;
    palmFacing = avgFingerZ < palmZ ? 'camera' : 'away';
  } else {
    palmFacing = 'side';
  }

  return {
    fingers: { thumb, index, middle, ring, pinky },
    palmFacing,
    handedness,
    landmarks,
    confidence: 1.0,
  };
}

// ============ GESTURE CLASSIFICATION ============

export interface GestureResult {
  label: string;
  category: 'letter' | 'number' | 'phrase' | 'dynamic';
  confidence: number;
  emoji?: string;
}

// ASL Alphabet Recognition
function classifyASLLetter(hand: HandAnalysis): GestureResult | null {
  const { thumb, index, middle, ring, pinky } = hand.fingers;
  const lm = hand.landmarks;

  // A: Fist with thumb to the side
  if (
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended &&
    thumb.extended
  ) {
    return { label: 'A', category: 'letter', confidence: 0.9, emoji: '🅰️' };
  }

  // B: All fingers up, thumb tucked
  if (
    index.extended &&
    middle.extended &&
    ring.extended &&
    pinky.extended &&
    !thumb.extended
  ) {
    return { label: 'B', category: 'letter', confidence: 0.85, emoji: '🅱️' };
  }

  // C: Curved hand (like holding a ball)
  if (
    thumb.extended &&
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended
  ) {
    const thumbTipToIndexTip = dist(
      lm[Landmarks.THUMB_TIP],
      lm[Landmarks.INDEX_TIP]
    );
    if (thumbTipToIndexTip > 0.08) {
      return { label: 'C', category: 'letter', confidence: 0.8 };
    }
  }

  // D: Index up, others closed, thumb touches middle
  if (
    index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended
  ) {
    const thumbTipToMiddleTip = dist(
      lm[Landmarks.THUMB_TIP],
      lm[Landmarks.MIDDLE_TIP]
    );
    if (thumbTipToMiddleTip < 0.05) {
      return { label: 'D', category: 'letter', confidence: 0.8 };
    }
  }

  // E: All fingers curled, thumb tucked
  if (
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended &&
    !thumb.extended
  ) {
    return { label: 'E', category: 'letter', confidence: 0.75 };
  }

  // F: OK sign (thumb and index touch, others extended)
  if (middle.extended && ring.extended && pinky.extended) {
    const thumbIndexDist = dist(
      lm[Landmarks.THUMB_TIP],
      lm[Landmarks.INDEX_TIP]
    );
    if (thumbIndexDist < 0.04) {
      return { label: 'F', category: 'letter', confidence: 0.85 };
    }
  }

  // G: Index pointing sideways, thumb parallel
  if (index.extended && !middle.extended && !ring.extended && !pinky.extended) {
    if (thumb.extended && hand.palmFacing === 'side') {
      return { label: 'G', category: 'letter', confidence: 0.75 };
    }
  }

  // H: Index and middle extended sideways
  if (
    index.extended &&
    middle.extended &&
    !ring.extended &&
    !pinky.extended &&
    hand.palmFacing === 'side'
  ) {
    return { label: 'H', category: 'letter', confidence: 0.7 };
  }

  // I: Pinky only
  if (
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    pinky.extended &&
    !thumb.extended
  ) {
    return { label: 'I', category: 'letter', confidence: 0.9 };
  }

  // J: Pinky only (with movement - handled in dynamic)
  // For static: same as I but lower confidence
  if (
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    pinky.extended &&
    thumb.extended
  ) {
    return { label: 'J', category: 'letter', confidence: 0.6 };
  }

  // K: Index, middle, thumb extended (like a gun)
  if (
    index.extended &&
    middle.extended &&
    !ring.extended &&
    !pinky.extended &&
    thumb.extended
  ) {
    // Check if middle finger is spread from index
    const indexMiddleDist = dist(
      lm[Landmarks.INDEX_TIP],
      lm[Landmarks.MIDDLE_TIP]
    );
    if (indexMiddleDist > 0.06) {
      return { label: 'K', category: 'letter', confidence: 0.7 };
    }
  }

  // L: Index + thumb (L shape)
  if (
    index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended &&
    thumb.extended
  ) {
    const thumbAngle = angle(
      lm[Landmarks.WRIST],
      lm[Landmarks.THUMB_MCP],
      lm[Landmarks.THUMB_TIP]
    );
    if (thumbAngle > 120) {
      return { label: 'L', category: 'letter', confidence: 0.85, emoji: '🤟' };
    }
  }

  // M: Fist with thumb between ring and pinky
  if (
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended
  ) {
    // Hard to distinguish from E/S/T without depth, skip
  }

  // N: Similar to M
  // O: All fingers curved to form O shape
  if (
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended
  ) {
    const allTipsClose =
      dist(lm[Landmarks.INDEX_TIP], lm[Landmarks.THUMB_TIP]) < 0.06 &&
      dist(lm[Landmarks.MIDDLE_TIP], lm[Landmarks.THUMB_TIP]) < 0.08;
    if (allTipsClose && thumb.extended) {
      return { label: 'O', category: 'letter', confidence: 0.7 };
    }
  }

  // P: K shape but pointing down
  // Q: G shape but pointing down

  // R: Index and middle crossed
  if (index.extended && middle.extended && !ring.extended && !pinky.extended) {
    const indexMiddleDist = dist(
      lm[Landmarks.INDEX_TIP],
      lm[Landmarks.MIDDLE_TIP]
    );
    if (indexMiddleDist < 0.02) {
      return { label: 'R', category: 'letter', confidence: 0.65 };
    }
  }

  // S: Fist with thumb over fingers
  if (
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended &&
    !thumb.extended
  ) {
    return { label: 'S', category: 'letter', confidence: 0.6 };
  }

  // T: Fist with thumb between index and middle
  // (Hard to distinguish from S without more depth info)

  // U: Index and middle together pointing up
  if (
    index.extended &&
    middle.extended &&
    !ring.extended &&
    !pinky.extended &&
    !thumb.extended
  ) {
    const indexMiddleDist = dist(
      lm[Landmarks.INDEX_TIP],
      lm[Landmarks.MIDDLE_TIP]
    );
    if (indexMiddleDist < 0.03) {
      return { label: 'U', category: 'letter', confidence: 0.75 };
    }
  }

  // V: Peace sign (index + middle spread)
  if (
    index.extended &&
    middle.extended &&
    !ring.extended &&
    !pinky.extended
  ) {
    const indexMiddleDist = dist(
      lm[Landmarks.INDEX_TIP],
      lm[Landmarks.MIDDLE_TIP]
    );
    if (indexMiddleDist > 0.04) {
      return { label: 'V', category: 'letter', confidence: 0.85, emoji: '✌️' };
    }
  }

  // W: Index, middle, ring spread
  if (
    index.extended &&
    middle.extended &&
    ring.extended &&
    !pinky.extended &&
    !thumb.extended
  ) {
    return { label: 'W', category: 'letter', confidence: 0.85, emoji: '🤟' };
  }

  // X: Index hooked (bent at DIP)
  if (
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended
  ) {
    if (index.angle > 60 && index.angle < 120) {
      return { label: 'X', category: 'letter', confidence: 0.5 };
    }
  }

  // Y: Thumb + pinky extended (shaka)
  if (
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    pinky.extended &&
    thumb.extended
  ) {
    return { label: 'Y', category: 'letter', confidence: 0.9, emoji: '🤙' };
  }

  return null;
}

// Number recognition (ASL numbers 0-9)
function classifyNumber(hand: HandAnalysis): GestureResult | null {
  const { thumb, index, middle, ring, pinky } = hand.fingers;
  const lm = hand.landmarks;

  // 0: O shape (all fingers curled to touch thumb)
  if (!index.extended && !middle.extended && !ring.extended && !pinky.extended) {
    const thumbIndexDist = dist(
      lm[Landmarks.THUMB_TIP],
      lm[Landmarks.INDEX_TIP]
    );
    if (thumbIndexDist < 0.05 && thumb.extended) {
      return { label: '0', category: 'number', confidence: 0.75 };
    }
  }

  // 1: Index only
  if (
    index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended &&
    !thumb.extended
  ) {
    return { label: '1', category: 'number', confidence: 0.9, emoji: '☝️' };
  }

  // 2: Peace sign
  if (
    index.extended &&
    middle.extended &&
    !ring.extended &&
    !pinky.extended &&
    !thumb.extended
  ) {
    const indexMiddleDist = dist(
      lm[Landmarks.INDEX_TIP],
      lm[Landmarks.MIDDLE_TIP]
    );
    if (indexMiddleDist > 0.04) {
      return { label: '2', category: 'number', confidence: 0.85, emoji: '✌️' };
    }
  }

  // 3: Thumb + index + middle
  if (
    index.extended &&
    middle.extended &&
    !ring.extended &&
    !pinky.extended &&
    thumb.extended
  ) {
    return { label: '3', category: 'number', confidence: 0.85 };
  }

  // 4: Four fingers (no thumb)
  if (
    index.extended &&
    middle.extended &&
    ring.extended &&
    pinky.extended &&
    !thumb.extended
  ) {
    return { label: '4', category: 'number', confidence: 0.9, emoji: '🖖' };
  }

  // 5: All five fingers spread
  if (
    index.extended &&
    middle.extended &&
    ring.extended &&
    pinky.extended &&
    thumb.extended
  ) {
    return { label: '5', category: 'number', confidence: 0.95, emoji: '🖐️' };
  }

  // 6: Pinky + thumb (similar to Y/shaka)
  if (
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    pinky.extended &&
    thumb.extended
  ) {
    return { label: '6', category: 'number', confidence: 0.7 };
  }

  // 7: Ring + pinky + thumb
  if (
    !index.extended &&
    !middle.extended &&
    ring.extended &&
    pinky.extended &&
    thumb.extended
  ) {
    return { label: '7', category: 'number', confidence: 0.75 };
  }

  // 8: Middle + ring + pinky + thumb
  if (
    !index.extended &&
    middle.extended &&
    ring.extended &&
    pinky.extended &&
    thumb.extended
  ) {
    return { label: '8', category: 'number', confidence: 0.8 };
  }

  // 9: Index + middle + ring + thumb
  if (
    index.extended &&
    middle.extended &&
    ring.extended &&
    !pinky.extended &&
    thumb.extended
  ) {
    return { label: '9', category: 'number', confidence: 0.8 };
  }

  return null;
}

// Common phrases/signs
function classifyPhrase(hand: HandAnalysis): GestureResult | null {
  const { thumb, index, middle, ring, pinky } = hand.fingers;
  const lm = hand.landmarks;

  // "I Love You" (ILY): Thumb + index + pinky extended
  if (
    index.extended &&
    !middle.extended &&
    !ring.extended &&
    pinky.extended &&
    thumb.extended
  ) {
    return {
      label: 'I Love You',
      category: 'phrase',
      confidence: 0.95,
      emoji: '🤟',
    };
  }

  // "OK": Thumb and index form circle, others extended
  if (middle.extended && ring.extended && pinky.extended) {
    const thumbIndexDist = dist(
      lm[Landmarks.THUMB_TIP],
      lm[Landmarks.INDEX_TIP]
    );
    if (thumbIndexDist < 0.04) {
      return { label: 'OK', category: 'phrase', confidence: 0.9, emoji: '👌' };
    }
  }

  // "Thumbs Up": Only thumb extended, fist
  if (
    thumb.extended &&
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended
  ) {
    // Check if thumb is pointing up (y coordinate)
    const thumbUp =
      lm[Landmarks.THUMB_TIP].y < lm[Landmarks.WRIST].y - 0.1;
    if (thumbUp) {
      return {
        label: 'Good / Yes',
        category: 'phrase',
        confidence: 0.85,
        emoji: '👍',
      };
    }
  }

  // "Thumbs Down"
  if (
    thumb.extended &&
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended
  ) {
    const thumbDown =
      lm[Landmarks.THUMB_TIP].y > lm[Landmarks.WRIST].y + 0.1;
    if (thumbDown) {
      return {
        label: 'Bad / No',
        category: 'phrase',
        confidence: 0.8,
        emoji: '👎',
      };
    }
  }

  // "Peace / Victory": V sign
  if (
    index.extended &&
    middle.extended &&
    !ring.extended &&
    !pinky.extended &&
    !thumb.extended
  ) {
    const indexMiddleDist = dist(
      lm[Landmarks.INDEX_TIP],
      lm[Landmarks.MIDDLE_TIP]
    );
    if (indexMiddleDist > 0.04) {
      return {
        label: 'Peace',
        category: 'phrase',
        confidence: 0.85,
        emoji: '✌️',
      };
    }
  }

  // "Rock On / Horns": Index + pinky
  if (
    index.extended &&
    !middle.extended &&
    !ring.extended &&
    pinky.extended &&
    !thumb.extended
  ) {
    return {
      label: 'Rock On',
      category: 'phrase',
      confidence: 0.9,
      emoji: '🤘',
    };
  }

  // "Call Me" (Shaka): Thumb + pinky
  if (
    !index.extended &&
    !middle.extended &&
    !ring.extended &&
    pinky.extended &&
    thumb.extended
  ) {
    return {
      label: 'Call Me',
      category: 'phrase',
      confidence: 0.85,
      emoji: '🤙',
    };
  }

  // "Stop / High Five": Open palm, all fingers up
  if (
    index.extended &&
    middle.extended &&
    ring.extended &&
    pinky.extended &&
    thumb.extended &&
    hand.palmFacing === 'camera'
  ) {
    return {
      label: 'Stop',
      category: 'phrase',
      confidence: 0.8,
      emoji: '🖐️',
    };
  }

  // "Thank You" (flat hand from chin): Hard to detect statically
  // Would need face detection + hand position relative to face

  // "Point / This": Index pointing
  if (
    index.extended &&
    !middle.extended &&
    !ring.extended &&
    !pinky.extended &&
    !thumb.extended
  ) {
    return {
      label: 'Point',
      category: 'phrase',
      confidence: 0.7,
      emoji: '☝️',
    };
  }

  return null;
}

// Main classification function
export function classifyGesture(hand: HandAnalysis): GestureResult | null {
  // Try phrases first (higher priority, more distinctive)
  const phrase = classifyPhrase(hand);
  if (phrase && phrase.confidence >= 0.8) return phrase;

  // Try numbers
  const number = classifyNumber(hand);
  if (number && number.confidence >= 0.8) return number;

  // Try letters
  const letter = classifyASLLetter(hand);
  if (letter && letter.confidence >= 0.75) return letter;

  // Return lower confidence results
  if (phrase) return phrase;
  if (number) return number;
  if (letter) return letter;

  return null;
}
