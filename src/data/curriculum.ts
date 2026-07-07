export interface ASLSign {
  label: string;
  description: string;
  keypoints: string[];
  videoUrl?: string;
  imageUrl?: string;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  signs: ASLSign[];
}

export const curriculum: Level[] = [
  {
    id: 'alphabet',
    name: 'Level 1: Alphabet',
    description: 'Learn the ASL alphabet (A-Z)',
    signs: [
      { label: 'A', description: 'Fist with thumb resting beside index finger', keypoints: ['Fist closed', 'Thumb extended and resting beside index finger', 'Palm facing forward'] },
      { label: 'B', description: 'Flat hand with thumb tucked across palm', keypoints: ['All fingers extended and together', 'Thumb bent across palm', 'Palm facing forward'] },
      { label: 'C', description: 'Curved hand shape like holding a ball', keypoints: ['All fingers curved', 'Thumb and fingertips form C shape', 'Hand slightly cupped'] },
      { label: 'D', description: 'Index finger up, other fingers touch thumb', keypoints: ['Index finger extended upward', 'Middle, ring, pinky fingers curled', 'Thumb touches curled fingers'] },
      { label: 'E', description: 'All fingers curled down toward thumb', keypoints: ['All fingers curled toward palm', 'Thumb relaxed', 'Fingertips point down'] },
      { label: 'F', description: 'OK sign with three fingers extended', keypoints: ['Thumb and index finger form circle', 'Middle, ring, pinky extended', 'Palm facing forward'] },
      { label: 'G', description: 'Index finger and thumb extended, pointing sideways', keypoints: ['Index finger extended', 'Thumb extended parallel to index', 'Other fingers curled', 'Hand points sideways'] },
      { label: 'H', description: 'Index and middle finger extended sideways', keypoints: ['Index and middle finger extended together', 'Thumb extended', 'Hand points sideways'] },
      { label: 'I', description: 'Pinky finger up, other fingers in fist', keypoints: ['Pinky finger extended', 'Other fingers curled into fist', 'Thumb rests on curled fingers'] },
      { label: 'J', description: 'Pinky up with J-shaped motion', keypoints: ['Pinky finger extended', 'Trace J shape in air', 'Start from top, curve down and left'] },
      { label: 'K', description: 'Index and middle finger up, thumb extended', keypoints: ['Index and middle finger extended (peace sign)', 'Thumb extended perpendicular', 'Ring and pinky curled'] },
      { label: 'L', description: 'L shape with thumb and index finger', keypoints: ['Index finger extended up', 'Thumb extended sideways', 'Other fingers curled', 'Forms L shape'] },
      { label: 'M', description: 'Fist with thumb under three fingers', keypoints: ['Make fist', 'Thumb goes under index, middle, ring fingers', 'Three fingers rest on thumb'] },
      { label: 'N', description: 'Fist with thumb under two fingers', keypoints: ['Make fist', 'Thumb goes under index and middle fingers', 'Two fingers rest on thumb'] },
      { label: 'O', description: 'All fingers curved to touch thumb', keypoints: ['All fingers curve to meet thumb', 'Forms O shape', 'Fingertips touch thumb tip'] },
      { label: 'P', description: 'K sign pointing down', keypoints: ['Index and middle finger extended', 'Thumb extended', 'Hand points downward'] },
      { label: 'Q', description: 'G sign pointing down', keypoints: ['Index finger and thumb extended', 'Hand points downward'] },
      { label: 'R', description: 'Index and middle finger crossed', keypoints: ['Index and middle finger extended', 'Fingers cross each other', 'Other fingers curled'] },
      { label: 'S', description: 'Fist with thumb over fingers', keypoints: ['Make tight fist', 'Thumb wraps over fingers', 'Palm faces forward'] },
      { label: 'T', description: 'Fist with thumb between index and middle', keypoints: ['Make fist', 'Thumb goes between index and middle finger', 'Thumb tip shows'] },
      { label: 'U', description: 'Index and middle finger together pointing up', keypoints: ['Index and middle finger extended together', 'Ring and pinky curled', 'Thumb holds them down'] },
      { label: 'V', description: 'Peace sign', keypoints: ['Index and middle finger extended', 'Fingers spread apart', 'Other fingers curled'] },
      { label: 'W', description: 'Three fingers up (index, middle, ring)', keypoints: ['Index, middle, ring fingers extended', 'Pinky curled', 'Thumb holds pinky down'] },
      { label: 'X', description: 'Index finger hooked', keypoints: ['Index finger bent at second joint', 'Other fingers in fist', 'Hook shape'] },
      { label: 'Y', description: 'Thumb and pinky extended', keypoints: ['Thumb extended', 'Pinky extended', 'Other fingers curled', 'Shaka sign'] },
      { label: 'Z', description: 'Index finger traces Z shape', keypoints: ['Index finger extended', 'Trace Z in air', 'Left to right, diagonal down, left to right'] },
    ],
  },
  {
    id: 'numbers',
    name: 'Level 2: Numbers',
    description: 'Learn ASL numbers 0-9',
    signs: [
      { label: '0', description: 'O shape', keypoints: ['Form O with all fingers', 'Fingertips touch thumb'] },
      { label: '1', description: 'Index finger up', keypoints: ['Index finger extended', 'Other fingers in fist'] },
      { label: '2', description: 'Peace sign (V)', keypoints: ['Index and middle finger up', 'Fingers spread'] },
      { label: '3', description: 'Thumb, index, and middle finger up', keypoints: ['Three fingers extended', 'Ring and pinky curled'] },
      { label: '4', description: 'Four fingers up, thumb tucked', keypoints: ['All fingers extended', 'Thumb tucked into palm'] },
      { label: '5', description: 'All five fingers spread', keypoints: ['All fingers extended and spread', 'Open hand'] },
      { label: '6', description: 'Pinky and thumb, other fingers on palm', keypoints: ['Pinky and thumb extended', 'Other fingers curled'] },
      { label: '7', description: 'Ring finger and pinky extended with thumb', keypoints: ['Ring and pinky extended', 'Thumb extended', 'Index and middle curled'] },
      { label: '8', description: 'Middle finger up with thumb', keypoints: ['Middle finger extended', 'Thumb touches middle finger', 'Other fingers curled'] },
      { label: '9', description: 'Index finger curled, others extended', keypoints: ['Index finger curled', 'Middle, ring, pinky extended', 'Thumb extended'] },
    ],
  },
  {
    id: 'common-words',
    name: 'Level 3: Common Words',
    description: 'Essential everyday signs',
    signs: [
      { label: 'Hello', description: 'Wave gesture', keypoints: ['Open hand', 'Wave side to side'] },
      { label: 'Thank you', description: 'Hand from chin forward', keypoints: ['Flat hand at chin', 'Move forward and down'] },
      { label: 'Please', description: 'Circular motion on chest', keypoints: ['Flat hand on chest', 'Rub in circular motion'] },
      { label: 'Yes', description: 'Nod fist up and down', keypoints: ['Fist', 'Nod up and down', 'Like head nodding'] },
      { label: 'No', description: 'Two fingers to thumb', keypoints: ['Index and middle finger', 'Tap thumb repeatedly'] },
      { label: 'Sorry', description: 'Fist circular on chest', keypoints: ['Fist on chest', 'Rub in circle'] },
      { label: 'Help', description: 'Thumbs up on palm', keypoints: ['Thumb up on flat palm', 'Lift up'] },
      { label: 'Good', description: 'Thumbs up', keypoints: ['Thumb extended up', 'Fist closed'] },
      { label: 'Bad', description: 'Thumbs down', keypoints: ['Thumb extended down', 'Fist closed'] },
      { label: 'Friend', description: 'Hook index fingers', keypoints: ['Both index fingers', 'Hook together'] },
      { label: 'Love', description: 'Cross arms over chest', keypoints: ['Both arms', 'Cross over heart'] },
      { label: 'Name', description: 'Two H signs tap', keypoints: ['H handshape', 'Tap together twice'] },
    ],
  },
];
