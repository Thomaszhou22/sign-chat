interface SignDiagramProps {
  label: string;
  description: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Finger configuration for each sign
// fingers: [thumb, index, middle, ring, pinky] - 1 = extended, 0 = curled
// thumbPos: 'side' | 'tucked' | 'curved' | 'cross' | 'touch'
// orientation: 'palm' | 'side' | 'down' | 'hook' | 'motion'
const configs: Record<string, { fingers: number[]; thumbPos?: string; orientation?: string; motion?: string }> = {
  // Alphabet
  'A': { fingers: [0,0,0,0,0], thumbPos: 'side' },
  'B': { fingers: [0,1,1,1,1], thumbPos: 'tucked' },
  'C': { fingers: [0,0,0,0,0], thumbPos: 'curved', orientation: 'cupped' },
  'D': { fingers: [0,1,0,0,0], thumbPos: 'touch' },
  'E': { fingers: [0,0,0,0,0], thumbPos: 'side', orientation: 'curled' },
  'F': { fingers: [0,0,1,1,1], thumbPos: 'circle' },
  'G': { fingers: [0,1,0,0,0], thumbPos: 'side', orientation: 'side' },
  'H': { fingers: [0,1,1,0,0], thumbPos: 'side', orientation: 'side' },
  'I': { fingers: [0,0,0,0,1], thumbPos: 'side' },
  'J': { fingers: [0,0,0,0,1], thumbPos: 'side', motion: 'down-curve' },
  'K': { fingers: [0,1,1,0,0], thumbPos: 'side' },
  'L': { fingers: [0,1,0,0,0], thumbPos: 'side', orientation: 'l-shape' },
  'M': { fingers: [0,0,0,0,0], thumbPos: 'under3' },
  'N': { fingers: [0,0,0,0,0], thumbPos: 'under2' },
  'O': { fingers: [0,0,0,0,0], thumbPos: 'circle', orientation: 'o-shape' },
  'P': { fingers: [0,1,1,0,0], thumbPos: 'side', orientation: 'down' },
  'Q': { fingers: [0,1,0,0,0], thumbPos: 'side', orientation: 'down' },
  'R': { fingers: [0,1,1,0,0], thumbPos: 'side', orientation: 'cross' },
  'S': { fingers: [0,0,0,0,0], thumbPos: 'over' },
  'T': { fingers: [0,0,0,0,0], thumbPos: 'between' },
  'U': { fingers: [0,1,1,0,0], thumbPos: 'side', orientation: 'together' },
  'V': { fingers: [0,1,1,0,0], thumbPos: 'side', orientation: 'spread' },
  'W': { fingers: [0,1,1,1,0], thumbPos: 'side' },
  'X': { fingers: [0,0,0,0,0], thumbPos: 'side', orientation: 'hook' },
  'Y': { fingers: [0,0,0,0,1], thumbPos: 'side', orientation: 'shaka' },
  'Z': { fingers: [0,1,0,0,0], thumbPos: 'side', motion: 'z-trace' },
  // Numbers
  '0': { fingers: [0,0,0,0,0], thumbPos: 'circle', orientation: 'o-shape' },
  '1': { fingers: [0,1,0,0,0], thumbPos: 'side' },
  '2': { fingers: [0,1,1,0,0], thumbPos: 'side', orientation: 'spread' },
  '3': { fingers: [0,1,1,0,0], thumbPos: 'extended' },
  '4': { fingers: [0,1,1,1,1], thumbPos: 'tucked' },
  '5': { fingers: [1,1,1,1,1], thumbPos: 'side', orientation: 'spread' },
  '6': { fingers: [0,0,0,0,1], thumbPos: 'side', orientation: 'shaka' },
  '7': { fingers: [0,0,0,1,1], thumbPos: 'extended' },
  '8': { fingers: [0,0,1,0,0], thumbPos: 'touch' },
  '9': { fingers: [0,0,1,1,1], thumbPos: 'side', orientation: 'hook-index' },
  // Common words
  'Hello': { fingers: [1,1,1,1,1], thumbPos: 'side', motion: 'wave' },
  'Thank you': { fingers: [0,1,1,1,1], thumbPos: 'tucked', motion: 'chin-forward' },
  'Please': { fingers: [0,1,1,1,1], thumbPos: 'tucked', motion: 'circle-chest' },
  'Yes': { fingers: [0,0,0,0,0], thumbPos: 'side', motion: 'nod' },
  'No': { fingers: [0,1,1,0,0], thumbPos: 'side', motion: 'snap' },
  'Sorry': { fingers: [0,0,0,0,0], thumbPos: 'side', motion: 'circle-chest' },
  'Help': { fingers: [0,1,1,1,1], thumbPos: 'up', motion: 'lift' },
  'Good': { fingers: [0,0,0,0,0], thumbPos: 'up' },
  'Bad': { fingers: [0,0,0,0,0], thumbPos: 'down' },
  'Friend': { fingers: [0,1,0,0,0], thumbPos: 'side', motion: 'hook' },
  'Love': { fingers: [0,0,0,0,0], thumbPos: 'side', motion: 'cross-arms' },
  'Name': { fingers: [0,1,1,0,0], thumbPos: 'side', motion: 'tap' },
  // Phrases
  'How are you': { fingers: [0,1,1,1,1], thumbPos: 'side', motion: 'rotate-point' },
  'My name is': { fingers: [0,1,1,0,0], thumbPos: 'side', motion: 'chest-tap-spell' },
  'Nice to meet you': { fingers: [0,1,1,1,1], thumbPos: 'tucked', motion: 'slide-meet-point' },
  'I love you': { fingers: [0,1,0,0,1], thumbPos: 'side', orientation: 'ily' },
  'See you later': { fingers: [0,1,1,0,0], thumbPos: 'side', motion: 'eyes-forward-tilt' },
  'Good morning': { fingers: [0,0,0,0,0], thumbPos: 'up', motion: 'rise' },
  'Good night': { fingers: [0,0,0,0,0], thumbPos: 'up', motion: 'drop' },
  'Excuse me': { fingers: [1,1,1,1,1], thumbPos: 'side', motion: 'brush' },
};

export default function SignDiagram({ label, description, size = 'md', className = '' }: SignDiagramProps) {
  const config = configs[label] || { fingers: [0,0,0,0,0], thumbPos: 'side' };
  
  const dims = {
    sm: { w: 140, h: 180, hand: 60, fs: 20, dfs: 10 },
    md: { w: 200, h: 260, hand: 80, fs: 28, dfs: 13 },
    lg: { w: 280, h: 360, hand: 110, fs: 38, dfs: 16 },
  }[size];

  const { w, h, hand, fs, dfs } = dims;
  const cx = w / 2;
  const cy = h / 2 - 10;

  // Finger X positions (from left to right: pinky, ring, middle, index, thumb)
  const fingerXPositions = [cx - hand * 0.35, cx - hand * 0.18, cx, cx + hand * 0.18, cx + hand * 0.4];
  
  const renderFingers = () => {
    return config.fingers.map((extended, i) => {
      const x = fingerXPositions[i];
      const isThumb = i === 4;
      const baseY = cy - hand * 0.1;
      
      if (isThumb) {
        // Thumb rendering
        const thumbExtended = extended === 1;
        const thumbPath = thumbExtended
          ? `M ${x} ${baseY + 10} Q ${x + 15} ${baseY - 10} ${x + 20} ${baseY - 30}`
          : `M ${x} ${baseY + 10} Q ${x + 10} ${baseY} ${x + 5} ${baseY + 5}`;
        
        return (
          <g key={i}>
            <path
              d={thumbPath}
              stroke={thumbExtended ? '#22d3ee' : '#64748b'}
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            {thumbExtended && (
              <circle cx={x + 20} cy={baseY - 30} r="4" fill="#22d3ee" />
            )}
          </g>
        );
      }
      
      // Regular finger rendering
      const fingerHeight = extended === 1 ? hand * 0.6 : hand * 0.2;
      const topY = baseY - fingerHeight;
      
      return (
        <g key={i}>
          <rect
            x={x - 6}
            y={topY}
            width="12"
            height={fingerHeight}
            rx="6"
            fill={extended === 1 ? '#22d3ee' : '#475569'}
            opacity={extended === 1 ? 1 : 0.6}
          />
          {extended === 1 && (
            <circle cx={x} cy={topY} r="6" fill="#22d3ee" />
          )}
          {extended === 0 && (
            <circle cx={x} cy={topY + fingerHeight * 0.3} r="5" fill="#475569" opacity="0.6" />
          )}
        </g>
      );
    });
  };

  const renderPalm = () => (
    <rect
      x={cx - hand * 0.4}
      y={cy - hand * 0.15}
      width={hand * 0.8}
      height={hand * 0.5}
      rx="12"
      fill="#1e293b"
      stroke="#334155"
      strokeWidth="2"
    />
  );

  const renderMotionArrow = () => {
    if (!config.motion) return null;
    
    const arrowColor = '#f59e0b';
    
    switch (config.motion) {
      case 'wave':
        return (
          <g>
            <path d={`M ${cx - 30} ${cy - hand * 0.7} Q ${cx} ${cy - hand * 0.9} ${cx + 30} ${cy - hand * 0.7}`} stroke={arrowColor} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d={`M ${cx + 25} ${cy - hand * 0.75} L ${cx + 30} ${cy - hand * 0.7} L ${cx + 25} ${cy - hand * 0.65}`} stroke={arrowColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        );
      case 'nod':
        return (
          <g>
            <path d={`M ${cx + hand * 0.6} ${cy - 20} L ${cx + hand * 0.6} ${cy + 10}`} stroke={arrowColor} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d={`M ${cx + hand * 0.6} ${cy + 10} L ${cx + hand * 0.6} ${cy - 20}`} stroke={arrowColor} strokeWidth="3" fill="none" strokeLinecap="round" markerEnd="url(#arrowhead)" />
            <path d={`M ${cx + hand * 0.55} ${cy + 5} L ${cx + hand * 0.6} ${cy + 10} L ${cx + hand * 0.65} ${cy + 5}`} stroke={arrowColor} strokeWidth="2" fill="none" />
          </g>
        );
      case 'circle-chest':
        return (
          <g>
            <circle cx={cx} cy={cy + hand * 0.5} r="12" stroke={arrowColor} strokeWidth="2" fill="none" strokeDasharray="4 2" />
            <path d={`M ${cx + 8} ${cy + hand * 0.5 - 8} L ${cx + 12} ${cy + hand * 0.5 - 4}`} stroke={arrowColor} strokeWidth="2" fill="none" />
          </g>
        );
      case 'chin-forward':
        return (
          <g>
            <path d={`M ${cx} ${cy - hand * 0.6} L ${cx} ${cy - hand * 0.3}`} stroke={arrowColor} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d={`M ${cx - 5} ${cy - hand * 0.35} L ${cx} ${cy - hand * 0.3} L ${cx + 5} ${cy - hand * 0.35}`} stroke={arrowColor} strokeWidth="2" fill="none" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`inline-block ${className}`}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block">
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#f59e0b" />
          </marker>
        </defs>
        
        {/* Background */}
        <rect width={w} height={h} fill="#0f172a" rx="12" />
        
        {/* Label */}
        <text x={cx} y={fs + 8} textAnchor="middle" fill="#22d3ee" fontSize={fs} fontWeight="bold" fontFamily="system-ui">
          {label}
        </text>
        
        {/* Hand diagram */}
        {renderPalm()}
        {renderFingers()}
        {renderMotionArrow()}
        
        {/* Orientation indicator */}
        {config.orientation === 'side' && (
          <text x={cx} y={cy + hand * 0.6} textAnchor="middle" fill="#94a3b8" fontSize={dfs} fontFamily="system-ui">
            ← sideways
          </text>
        )}
        {config.orientation === 'down' && (
          <text x={cx} y={cy + hand * 0.6} textAnchor="middle" fill="#94a3b8" fontSize={dfs} fontFamily="system-ui">
            ↓ pointing down
          </text>
        )}
        {config.orientation === 'l-shape' && (
          <text x={cx} y={cy + hand * 0.6} textAnchor="middle" fill="#94a3b8" fontSize={dfs} fontFamily="system-ui">
            L-shape 90°
          </text>
        )}
        
        {/* Description */}
        <text x={cx} y={h - 12} textAnchor="middle" fill="#64748b" fontSize={dfs} fontFamily="system-ui">
          {description.length > 30 ? description.slice(0, 28) + '...' : description}
        </text>
      </svg>
    </div>
  );
}
