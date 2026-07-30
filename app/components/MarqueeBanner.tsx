type MarqueeBannerProps = {
  text: string;
};

const REPEAT_COUNT = 4;

export function MarqueeBanner({ text }: MarqueeBannerProps) {
  const items = Array.from({ length: REPEAT_COUNT }, (_, i) => i);

  return (
    <div className="overflow-hidden border-y-2 border-navy bg-orange py-3">
      <div className="animate-marquee flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
            {items.map((i) => (
              <span
                key={i}
                className="font-display mx-8 shrink-0 whitespace-nowrap text-lg tracking-wider text-cream sm:text-xl"
              >
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
