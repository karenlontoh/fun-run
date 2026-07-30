export function ScrollCue({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-float flex flex-col items-center gap-1 text-cream/50 ${className}`}>
      <span className="text-[10px] tracking-[0.3em]">SCROLL</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
