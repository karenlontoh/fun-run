type MarqueeBannerProps = {
  text: string;
};

export function MarqueeBanner({ text }: MarqueeBannerProps) {
  const repeated = Array.from({ length: 6 }, () => text).join("");

  return (
    <div className="overflow-hidden border-y-2 border-navy bg-orange py-3">
      <div className="animate-marquee flex w-max">
        <span className="font-display shrink-0 whitespace-nowrap text-lg tracking-wide text-cream sm:text-xl">
          {repeated}
        </span>
        <span className="font-display shrink-0 whitespace-nowrap text-lg tracking-wide text-cream sm:text-xl" aria-hidden>
          {repeated}
        </span>
      </div>
    </div>
  );
}
