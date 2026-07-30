type EyebrowProps = {
  index: string;
  label: string;
  className?: string;
};

/** Small numbered label used above section headings for an editorial-poster feel. */
export function Eyebrow({ index, label, className = "" }: EyebrowProps) {
  return (
    <div className={`flex items-center gap-3 font-display text-sm tracking-[0.2em] ${className}`}>
      <span className="opacity-50">{index}</span>
      <span className="h-px w-10 bg-current opacity-50" />
      <span>{label}</span>
    </div>
  );
}
