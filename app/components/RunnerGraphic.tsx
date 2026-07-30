type RunnerGraphicProps = {
  className?: string;
};

/**
 * Bold running-figure pictogram built from thick round-capped strokes that
 * share endpoints at each joint (shoulder/hip), so limbs read as connected
 * rather than as separate floating shapes. Kept abstract/chunky to match
 * the brand's poster-style graphics rather than a photorealistic figure.
 */
export function RunnerGraphic({ className = "" }: RunnerGraphicProps) {
  const limb = "currentColor";
  return (
    <svg viewBox="0 0 240 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* speed streaks, trailing behind the figure */}
      <g className="animate-run-streak" style={{ animationDelay: "0s" }}>
        <line x1="8" y1="150" x2="44" y2="150" stroke={limb} strokeWidth="9" strokeLinecap="round" opacity="0.35" />
      </g>
      <g className="animate-run-streak" style={{ animationDelay: "0.15s" }}>
        <line x1="0" y1="170" x2="46" y2="170" stroke={limb} strokeWidth="9" strokeLinecap="round" opacity="0.5" />
      </g>
      <g className="animate-run-streak" style={{ animationDelay: "0.3s" }}>
        <line x1="12" y1="190" x2="38" y2="190" stroke={limb} strokeWidth="9" strokeLinecap="round" opacity="0.35" />
      </g>

      <g className="animate-run-bounce" strokeLinecap="round" strokeLinejoin="round">
        {/* back arm: shoulder -> elbow -> hand */}
        <path d="M150 62 L178 78 L164 104" stroke={limb} strokeWidth="16" />
        {/* back leg: hip -> knee -> foot, trailing behind */}
        <path d="M118 116 L88 142 L54 148" stroke={limb} strokeWidth="20" />
        {/* torso: shoulder -> hip */}
        <path d="M150 62 L118 116" stroke={limb} strokeWidth="24" />
        {/* front leg: hip -> knee (driving up) -> foot */}
        <path d="M118 116 L146 138 L120 174" stroke={limb} strokeWidth="20" />
        {/* front arm: shoulder -> elbow -> hand */}
        <path d="M150 62 L124 76 L138 52" stroke={limb} strokeWidth="16" />
        {/* head */}
        <circle cx="160" cy="40" r="19" fill={limb} />
      </g>
    </svg>
  );
}
