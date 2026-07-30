type RunnerGraphicProps = {
  className?: string;
};

/**
 * Bold geometric runner silhouette built from simple rotated shapes — kept
 * abstract/blocky to match the brand's poster-style graphics rather than
 * attempting a photorealistic figure. Animated via CSS (see .animate-run*
 * classes in globals.css) so it reads as mid-stride motion, not a static icon.
 */
export function RunnerGraphic({ className = "" }: RunnerGraphicProps) {
  return (
    <svg viewBox="0 0 240 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* motion lines */}
      <rect className="animate-run-streak" x="10" y="70" width="46" height="10" rx="5" fill="currentColor" style={{ animationDelay: "0s" }} />
      <rect className="animate-run-streak" x="0" y="95" width="60" height="10" rx="5" fill="currentColor" style={{ animationDelay: "0.15s" }} />
      <rect className="animate-run-streak" x="14" y="120" width="40" height="10" rx="5" fill="currentColor" style={{ animationDelay: "0.3s" }} />

      <g className="animate-run-bounce">
        {/* back arm */}
        <rect x="120" y="68" width="15" height="44" rx="7.5" fill="currentColor" transform="rotate(55 127.5 90)" />
        {/* back leg */}
        <rect x="149" y="114" width="17" height="72" rx="8.5" fill="currentColor" transform="rotate(35 157.5 150)" />
        {/* torso */}
        <rect x="131" y="57" width="24" height="62" rx="12" fill="currentColor" transform="rotate(18 143 88)" />
        {/* front leg: thigh */}
        <rect x="117" y="111" width="19" height="40" rx="9.5" fill="currentColor" transform="rotate(-55 126.5 131)" />
        {/* front leg: shin */}
        <rect x="97" y="138" width="15" height="40" rx="7.5" fill="currentColor" transform="rotate(35 104.5 158)" />
        {/* front arm */}
        <rect x="149" y="64" width="15" height="46" rx="7.5" fill="currentColor" transform="rotate(-45 156.5 87)" />
        {/* head */}
        <circle cx="161" cy="41" r="17" fill="currentColor" />
      </g>
    </svg>
  );
}
