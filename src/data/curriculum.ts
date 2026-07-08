export interface ASLSign {
  label: string;
  description: string;
  keypoints: string[];
  hints?: string[];
  videoUrl?: string;
  imageUrl?: string;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  signs: ASLSign[];
}

// Wikimedia Commons ASL letter images (public domain)
const ASL_LETTER_BASE = 'https://upload.wikimedia.org/wikipedia/commons';

const letterImages: Record<string, string> = {
  A: `${ASL_LETTER_BASE}/2/27/Sign_language_A.svg`,
  B: `${ASL_LETTER_BASE}/1/18/Sign_language_B.svg`,
  C: `${ASL_LETTER_BASE}/e/e3/Sign_language_C.svg`,
  D: `${ASL_LETTER_BASE}/0/06/Sign_language_D.svg`,
  E: `${ASL_LETTER_BASE}/c/cd/Sign_language_E.svg`,
  F: `${ASL_LETTER_BASE}/8/8f/Sign_language_F.svg`,
  G: `${ASL_LETTER_BASE}/d/d9/Sign_language_G.svg`,
  H: `${ASL_LETTER_BASE}/9/97/Sign_language_H.svg`,
  I: `${ASL_LETTER_BASE}/1/10/Sign_language_I.svg`,
  J: `${ASL_LETTER_BASE}/b/b1/Sign_language_J.svg`,
  K: `${ASL_LETTER_BASE}/9/97/Sign_language_K.svg`,
  L: `${ASL_LETTER_BASE}/d/d2/Sign_language_L.svg`,
  M: `${ASL_LETTER_BASE}/c/c4/Sign_language_M.svg`,
  N: `${ASL_LETTER_BASE}/e/e6/Sign_language_N.svg`,
  O: `${ASL_LETTER_BASE}/e/e0/Sign_language_O.svg`,
  P: `${ASL_LETTER_BASE}/0/08/Sign_language_P.svg`,
  Q: `${ASL_LETTER_BASE}/3/34/Sign_language_Q.svg`,
  R: `${ASL_LETTER_BASE}/3/3d/Sign_language_R.svg`,
  S: `${ASL_LETTER_BASE}/3/3f/Sign_language_S.svg`,
  T: `${ASL_LETTER_BASE}/1/13/Sign_language_T.svg`,
  U: `${ASL_LETTER_BASE}/7/7c/Sign_language_U.svg`,
  V: `${ASL_LETTER_BASE}/c/ca/Sign_language_V.svg`,
  W: `${ASL_LETTER_BASE}/8/83/Sign_language_W.svg`,
  X: `${ASL_LETTER_BASE}/b/b7/Sign_language_X.svg`,
  Y: `${ASL_LETTER_BASE}/1/1d/Sign_language_Y.svg`,
  Z: `${ASL_LETTER_BASE}/0/0a/Sign_language_Z.svg`,
};

const numberImages: Record<string, string> = {
  '0': `${ASL_LETTER_BASE}/e/e0/Sign_language_O.svg`,
  '1': `${ASL_LETTER_BASE}/f/f3/Sign_language_1.jpg`,
  '2': `${ASL_LETTER_BASE}/a/a3/Sign_language_2.jpg`,
  '3': `${ASL_LETTER_BASE}/8/8b/Sign_language_3.jpg`,
  '4': `${ASL_LETTER_BASE}/c/cc/Sign_language_4.jpg`,
  '5': `${ASL_LETTER_BASE}/8/83/Sign_language_W.svg`,
  '6': `${ASL_LETTER_BASE}/3/31/Sign_language_6.jpg`,
  '7': `${ASL_LETTER_BASE}/0/0f/Sign_language_7.jpg`,
  '8': `${ASL_LETTER_BASE}/4/44/Sign_language_8.jpg`,
  '9': `${ASL_LETTER_BASE}/5/55/Sign_language_9.jpg`,
};

export const curriculum: Level[] = [
  {
    id: 'alphabet',
    name: 'Level 1: Alphabet',
    description: 'Learn the ASL alphabet (A-Z)',
    signs: [
      { label: 'A', description: 'Fist with thumb resting beside index finger', keypoints: ['Fist closed', 'Thumb extended and resting beside index finger', 'Palm facing forward'], hints: ['Keep your fist tight', 'Thumb should rest against the side, not on top'], imageUrl: letterImages.A },
      { label: 'B', description: 'Flat hand with thumb tucked across palm', keypoints: ['All fingers extended and together', 'Thumb bent across palm', 'Palm facing forward'], hints: ['Fingers should be straight and touching', 'Thumb crosses over your palm horizontally'], imageUrl: letterImages.B },
      { label: 'C', description: 'Curved hand shape like holding a ball', keypoints: ['All fingers curved', 'Thumb and fingertips form C shape', 'Hand slightly cupped'], hints: ['Imagine holding a tennis ball', 'Keep space between thumb and fingers'], imageUrl: letterImages.C },
      { label: 'D', description: 'Index finger up, other fingers touch thumb', keypoints: ['Index finger extended upward', 'Middle, ring, pinky fingers curled', 'Thumb touches curled fingers'], hints: ['Point straight up with index', 'Thumb pad touches the three curled fingertips'], imageUrl: letterImages.D },
      { label: 'E', description: 'All fingers curled down toward thumb', keypoints: ['All fingers curled toward palm', 'Thumb relaxed', 'Fingertips point down'], hints: ['Like a loose fist', 'Fingers curl inward but dont touch palm'], imageUrl: letterImages.E },
      { label: 'F', description: 'OK sign with three fingers extended', keypoints: ['Thumb and index finger form circle', 'Middle, ring, pinky extended', 'Palm facing forward'], hints: ['Make a perfect circle with thumb and index', 'Other three fingers fan out'], imageUrl: letterImages.F },
      { label: 'G', description: 'Index finger and thumb extended, pointing sideways', keypoints: ['Index finger extended', 'Thumb extended parallel to index', 'Other fingers curled', 'Hand points sideways'], hints: ['Point sideways, not forward', 'Index and thumb should be parallel'], imageUrl: letterImages.G },
      { label: 'H', description: 'Index and middle finger extended sideways', keypoints: ['Index and middle finger extended together', 'Thumb extended', 'Hand points sideways'], hints: ['Like G but with two fingers', 'Keep fingers together and pointing sideways'], imageUrl: letterImages.H },
      { label: 'I', description: 'Pinky finger up, other fingers in fist', keypoints: ['Pinky finger extended', 'Other fingers curled into fist', 'Thumb rests on curled fingers'], hints: ['Only pinky sticks out', 'Keep other fingers tucked tight'], imageUrl: letterImages.I },
      { label: 'J', description: 'Pinky up with J-shaped motion', keypoints: ['Pinky finger extended', 'Trace J shape in air', 'Start from top, curve down and left'], hints: ['Same hand shape as I', 'Add a downward J motion'], imageUrl: letterImages.J },
      { label: 'K', description: 'Index and middle finger up, thumb extended', keypoints: ['Index and middle finger extended (peace sign)', 'Thumb extended perpendicular', 'Ring and pinky curled'], hints: ['Peace sign plus thumb sticking out', 'Thumb points toward you'], imageUrl: letterImages.K },
      { label: 'L', description: 'L shape with thumb and index finger', keypoints: ['Index finger extended up', 'Thumb extended sideways', 'Other fingers curled', 'Forms L shape'], hints: ['Make a perfect 90-degree L', 'Other fingers stay curled in'], imageUrl: letterImages.L },
      { label: 'M', description: 'Fist with thumb under three fingers', keypoints: ['Make fist', 'Thumb goes under index, middle, ring fingers', 'Three fingers rest on thumb'], hints: ['Tuck thumb under your first three fingers', 'Fingertips should rest on thumb'], imageUrl: letterImages.M },
      { label: 'N', description: 'Fist with thumb under two fingers', keypoints: ['Make fist', 'Thumb goes under index and middle fingers', 'Two fingers rest on thumb'], hints: ['Like M but only two fingers over thumb', 'Ring and pinky stay curled'], imageUrl: letterImages.N },
      { label: 'O', description: 'All fingers curved to touch thumb', keypoints: ['All fingers curve to meet thumb', 'Forms O shape', 'Fingertips touch thumb tip'], hints: ['Make a circle with all fingers', 'All fingertips should touch thumb tip'], imageUrl: letterImages.O },
      { label: 'P', description: 'K sign pointing down', keypoints: ['Index and middle finger extended', 'Thumb extended', 'Hand points downward'], hints: ['Same shape as K', 'Rotate your hand so fingers point down'], imageUrl: letterImages.P },
      { label: 'Q', description: 'G sign pointing down', keypoints: ['Index finger and thumb extended', 'Hand points downward'], hints: ['Same shape as G', 'Point your fingers toward the ground'], imageUrl: letterImages.Q },
      { label: 'R', description: 'Index and middle finger crossed', keypoints: ['Index and middle finger extended', 'Fingers cross each other', 'Other fingers curled'], hints: ['Cross index over middle finger', 'Keep other fingers in a fist'], imageUrl: letterImages.R },
      { label: 'S', description: 'Fist with thumb over fingers', keypoints: ['Make tight fist', 'Thumb wraps over fingers', 'Palm faces forward'], hints: ['Thumb goes OVER your fingers, not beside', 'Make a tight, clean fist'], imageUrl: letterImages.S },
      { label: 'T', description: 'Fist with thumb between index and middle', keypoints: ['Make fist', 'Thumb goes between index and middle finger', 'Thumb tip shows'], hints: ['Peek thumb out between first two fingers', 'Only thumb tip should be visible'], imageUrl: letterImages.T },
      { label: 'U', description: 'Index and middle finger together pointing up', keypoints: ['Index and middle finger extended together', 'Ring and pinky curled', 'Thumb holds them down'], hints: ['Like a peace sign but fingers touching', 'Keep fingers pressed together'], imageUrl: letterImages.U },
      { label: 'V', description: 'Peace sign', keypoints: ['Index and middle finger extended', 'Fingers spread apart', 'Other fingers curled'], hints: ['Spread your two fingers wide', 'Classic peace sign shape'], imageUrl: letterImages.V },
      { label: 'W', description: 'Three fingers up (index, middle, ring)', keypoints: ['Index, middle, ring fingers extended', 'Pinky curled', 'Thumb holds pinky down'], hints: ['Three fingers fanned out', 'Only pinky stays down'], imageUrl: letterImages.W },
      { label: 'X', description: 'Index finger hooked', keypoints: ['Index finger bent at second joint', 'Other fingers in fist', 'Hook shape'], hints: ['Bend only the tip of your index finger', 'Make a hook or claw shape'], imageUrl: letterImages.X },
      { label: 'Y', description: 'Thumb and pinky extended', keypoints: ['Thumb extended', 'Pinky extended', 'Other fingers curled', 'Shaka sign'], hints: ['Spread thumb and pinky wide', 'Middle three fingers stay curled', 'Like the shaka/hang loose sign'], imageUrl: letterImages.Y },
      { label: 'Z', description: 'Index finger traces Z shape', keypoints: ['Index finger extended', 'Trace Z in air', 'Left to right, diagonal down, left to right'], hints: ['Draw a Z in the air', 'Keep other fingers in a fist'], imageUrl: letterImages.Z },
    ],
  },
  {
    id: 'numbers',
    name: 'Level 2: Numbers',
    description: 'Learn ASL numbers 0-9',
    signs: [
      { label: '0', description: 'O shape', keypoints: ['Form O with all fingers', 'Fingertips touch thumb'], hints: ['Same as letter O', 'Make a clean circle'], imageUrl: letterImages.O },
      { label: '1', description: 'Index finger up', keypoints: ['Index finger extended', 'Other fingers in fist'], hints: ['Point straight up', 'Keep fist tight'], imageUrl: numberImages['1'] },
      { label: '2', description: 'Peace sign (V)', keypoints: ['Index and middle finger up', 'Fingers spread'], hints: ['Same as letter V', 'Spread fingers apart'], imageUrl: numberImages['2'] },
      { label: '3', description: 'Thumb, index, and middle finger up', keypoints: ['Three fingers extended', 'Ring and pinky curled'], hints: ['Thumb counts as one finger here', 'Three points up'], imageUrl: numberImages['3'] },
      { label: '4', description: 'Four fingers up, thumb tucked', keypoints: ['All fingers extended', 'Thumb tucked into palm'], hints: ['Four fingers straight up', 'Thumb hides in your palm'], imageUrl: numberImages['4'] },
      { label: '5', description: 'All five fingers spread', keypoints: ['All fingers extended and spread', 'Open hand'], hints: ['Spread all fingers wide', 'Like a starfish'], imageUrl: letterImages.Y },
      { label: '6', description: 'Pinky and thumb, other fingers on palm', keypoints: ['Pinky and thumb extended', 'Other fingers curled'], hints: ['Same as letter Y/shaka', 'Only thumb and pinky out'], imageUrl: numberImages['6'] },
      { label: '7', description: 'Ring finger and pinky extended with thumb', keypoints: ['Ring and pinky extended', 'Thumb extended', 'Index and middle curled'], hints: ['Three digits out: thumb, ring, pinky', 'Index and middle curl in'], imageUrl: numberImages['7'] },
      { label: '8', description: 'Middle finger up with thumb', keypoints: ['Middle finger extended', 'Thumb touches middle finger', 'Other fingers curled'], hints: ['Middle finger points up', 'Thumb rests against it'], imageUrl: numberImages['8'] },
      { label: '9', description: 'Index finger curled, others extended', keypoints: ['Index finger curled', 'Middle, ring, pinky extended', 'Thumb extended'], hints: ['Curl only your index finger', 'Other fingers stay straight'], imageUrl: numberImages['9'] },
    ],
  },
  {
    id: 'common-words',
    name: 'Level 3: Common Words',
    description: 'Essential everyday signs',
    signs: [
      { label: 'Hello', description: 'Wave gesture', keypoints: ['Open hand', 'Wave side to side'], hints: ['Use open hand like B shape', 'Wave gently left and right'], imageUrl: letterImages.H },
      { label: 'Thank you', description: 'Hand from chin forward', keypoints: ['Flat hand at chin', 'Move forward and down'], hints: ['Start with fingertips at chin', 'Move hand forward like blowing a kiss'], imageUrl: letterImages.T },
      { label: 'Please', description: 'Circular motion on chest', keypoints: ['Flat hand on chest', 'Rub in circular motion'], hints: ['Place flat hand on your chest', 'Make small circles'], imageUrl: letterImages.P },
      { label: 'Yes', description: 'Nod fist up and down', keypoints: ['Fist', 'Nod up and down', 'Like head nodding'], hints: ['Make a fist (S shape)', 'Move it up and down like nodding'], imageUrl: letterImages.Y },
      { label: 'No', description: 'Two fingers to thumb', keypoints: ['Index and middle finger', 'Tap thumb repeatedly'], hints: ['Extend index and middle', 'Snap them to thumb repeatedly'], imageUrl: letterImages.N },
      { label: 'Sorry', description: 'Fist circular on chest', keypoints: ['Fist on chest', 'Rub in circle'], hints: ['Make an A fist', 'Rub in clockwise circles on chest'], imageUrl: letterImages.S },
      { label: 'Help', description: 'Thumbs up on palm', keypoints: ['Thumb up on flat palm', 'Lift up'], hints: ['Left hand flat, right thumb up on it', 'Lift both hands up together'], imageUrl: letterImages.H },
      { label: 'Good', description: 'Thumbs up', keypoints: ['Thumb extended up', 'Fist closed'], hints: ['Classic thumbs up', 'Thumb points to ceiling'], imageUrl: letterImages.G },
      { label: 'Bad', description: 'Thumbs down', keypoints: ['Thumb extended down', 'Fist closed'], hints: ['Reverse of thumbs up', 'Thumb points to floor'], imageUrl: letterImages.B },
      { label: 'Friend', description: 'Hook index fingers', keypoints: ['Both index fingers', 'Hook together'], hints: ['Point both index fingers', 'Hook them together like linking'], imageUrl: letterImages.F },
      { label: 'Love', description: 'Cross arms over chest', keypoints: ['Both arms', 'Cross over heart'], hints: ['Cross both arms over your chest', 'Like giving yourself a hug'], imageUrl: letterImages.L },
      { label: 'Name', description: 'Two H signs tap', keypoints: ['H handshape', 'Tap together twice'], hints: ['Make H with both hands', 'Tap middle fingers together twice'], imageUrl: letterImages.N },
    ],
  },
  {
    id: 'phrases',
    name: 'Level 4: Phrases',
    description: 'Combine signs into phrases and sentences',
    signs: [
      { label: 'How are you', description: 'Sign: HOW + YOU', keypoints: ['HOW: Both hands in fists, thumbs up, rotate', 'YOU: Point at the person'], hints: ['Start with HOW gesture', 'Then point to your partner'] },
      { label: 'My name is', description: 'Sign: MY + NAME + finger-spell name', keypoints: ['MY: Flat hand on chest', 'NAME: H-hands tap twice', 'Then fingerspell your name'], hints: ['Touch chest for MY', 'Tap H-hands for NAME', 'Spell out your name letter by letter'] },
      { label: 'Nice to meet you', description: 'Sign: NICE + MEET + YOU', keypoints: ['NICE: Flat hand slides across other flat hand', 'MEET: Both index fingers come together', 'YOU: Point at person'], hints: ['Slide right hand over left (NICE)', 'Bring index fingers together (MEET)', 'Point forward (YOU)'] },
      { label: 'I love you', description: 'ILY handshape', keypoints: ['Thumb, index, and pinky extended', 'Middle and ring fingers curled', 'Hold up toward person'], hints: ['Combine I + L + Y in one hand', 'Thumb out, index up, pinky out', 'The classic I Love You sign'] },
      { label: 'See you later', description: 'Sign: SEE + YOU + LATER', keypoints: ['SEE: V-fingers from eyes forward', 'YOU: Point at person', 'LATER: L-hand tilts down'], hints: ['V-sign at eyes, move forward (SEE)', 'Point at person (YOU)', 'L-hand tips drop down (LATER)'] },
      { label: 'Good morning', description: 'Sign: GOOD + MORNING', keypoints: ['GOOD: Thumbs up from chin', 'MORNING: Arm rises like sun'], hints: ['Thumbs up from chin (GOOD)', 'Raise bent arm up like sunrise (MORNING)'] },
      { label: 'Good night', description: 'Sign: GOOD + NIGHT', keypoints: ['GOOD: Thumbs up from chin', 'NIGHT: Hand drops like moon setting'], hints: ['Thumbs up from chin (GOOD)', 'Drop hand down like sunset (NIGHT)'] },
      { label: 'Excuse me', description: 'Brush hands past each other', keypoints: ['Both open hands', 'Brush past each other sideways'], hints: ['Hands start together', 'Brush them past each other to the sides'] },
    ],
  },
];
