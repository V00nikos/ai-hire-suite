interface LaurelWreathProps {
  rank: number;
  score?: number | null;
  className?: string;
}

// Minimum score required to show laurel wreath
const MIN_SCORE_THRESHOLD = 60;
// Top ranks that always show laurel (even without score)
const TOP_RANKS = 3;

export function LaurelWreath({ rank, score, className = "" }: LaurelWreathProps) {
  // Determine if we should show laurel wreath
  const hasHighScore = score !== null && score !== undefined && score >= MIN_SCORE_THRESHOLD;
  const isTopRank = rank > 0 && rank <= TOP_RANKS;
  const shouldShowLaurel = hasHighScore || isTopRank;

  // If no laurel, show nothing (no badge for unscored candidates)
  if (!shouldShowLaurel) {
    return null;
  }

  // Metallic colors based on rank
  const getColors = () => {
    if (rank === 1) return { primary: "#1a1a1a", secondary: "#3a3a3a", highlight: "#5a5a5a" };
    if (rank === 2) return { primary: "#2d2d2d", secondary: "#4d4d4d", highlight: "#6d6d6d" };
    if (rank === 3) return { primary: "#404040", secondary: "#606060", highlight: "#808080" };
    // For non-top-3 but high scorers
    return { primary: "#505050", secondary: "#707070", highlight: "#909090" };
  };

  const colors = getColors();

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="56"
        height="44"
        viewBox="0 0 56 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        <defs>
          <linearGradient id={`laurel-gradient-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.highlight} />
            <stop offset="50%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          <linearGradient id={`laurel-gradient-right-${rank}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.highlight} />
            <stop offset="50%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
        </defs>

        {/* Left branch */}
        <g>
          <path
            d="M 20 38 Q 14 28 16 8"
            stroke={colors.primary}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 16 36 Q 8 32 6 26 Q 10 28 16 32 Q 14 34 16 36 Z"
            fill={`url(#laurel-gradient-${rank})`}
          />
          <path
            d="M 14 30 Q 6 26 4 20 Q 8 22 14 26 Q 12 28 14 30 Z"
            fill={`url(#laurel-gradient-${rank})`}
          />
          <path
            d="M 13 24 Q 5 20 3 14 Q 7 16 13 20 Q 11 22 13 24 Z"
            fill={`url(#laurel-gradient-${rank})`}
          />
          <path
            d="M 14 18 Q 6 14 5 8 Q 9 10 14 14 Q 12 16 14 18 Z"
            fill={`url(#laurel-gradient-${rank})`}
          />
          <path
            d="M 16 12 Q 10 8 10 2 Q 14 4 16 8 Q 15 10 16 12 Z"
            fill={`url(#laurel-gradient-${rank})`}
          />
        </g>

        {/* Right branch (mirrored) */}
        <g>
          <path
            d="M 36 38 Q 42 28 40 8"
            stroke={colors.primary}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 40 36 Q 48 32 50 26 Q 46 28 40 32 Q 42 34 40 36 Z"
            fill={`url(#laurel-gradient-right-${rank})`}
          />
          <path
            d="M 42 30 Q 50 26 52 20 Q 48 22 42 26 Q 44 28 42 30 Z"
            fill={`url(#laurel-gradient-right-${rank})`}
          />
          <path
            d="M 43 24 Q 51 20 53 14 Q 49 16 43 20 Q 45 22 43 24 Z"
            fill={`url(#laurel-gradient-right-${rank})`}
          />
          <path
            d="M 42 18 Q 50 14 51 8 Q 47 10 42 14 Q 44 16 42 18 Z"
            fill={`url(#laurel-gradient-right-${rank})`}
          />
          <path
            d="M 40 12 Q 46 8 46 2 Q 42 4 40 8 Q 41 10 40 12 Z"
            fill={`url(#laurel-gradient-right-${rank})`}
          />
        </g>
      </svg>
      
      {/* Rank number in center */}
      <span className="absolute text-xl font-display font-bold text-foreground">
        {rank > 0 && rank <= TOP_RANKS ? rank : '★'}
      </span>
    </div>
  );
}
