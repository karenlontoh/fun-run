type MarqueeBannerProps = {
  text: string;
  color?: "orange" | "lime";
  reverse?: boolean;
  skewDeg?: number;
};

const REPEAT_COUNT = 4;

const COLOR_CLASSES = {
  orange: "bg-orange text-cream",
  lime: "bg-lime text-navy",
} as const;

export function MarqueeBanner({ text, color = "orange", reverse = false, skewDeg = 0 }: MarqueeBannerProps) {
  const items = Array.from({ length: REPEAT_COUNT }, (_, i) => i);

  return (
    <div
      className={`relative z-0 overflow-hidden border-y-2 border-navy py-3 ${COLOR_CLASSES[color]}`}
      style={{
        transform: skewDeg ? `skewY(${skewDeg}deg)` : undefined,
        maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
      }}
    >
      <div className={`flex w-max ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
            {items.map((i) => (
              <span key={i} className="font-display mx-8 shrink-0 whitespace-nowrap text-lg tracking-wider sm:text-xl">
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
