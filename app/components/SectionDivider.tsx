type SectionDividerProps = {
  /** Tailwind bg-* class for the flat base strip (matches the section above). */
  base: string;
  /** Tailwind bg-* class for the diagonal wedge (matches the section below). */
  wedge: string;
  /** Flip the diagonal direction. */
  flip?: boolean;
};

/**
 * Thin diagonal wedge dropped between two solid-color sections so the page
 * doesn't read as a flat stack of rectangles — echoes the brand's angled
 * logo/shape motif at the seams instead of a hard horizontal line.
 */
export function SectionDivider({ base, wedge, flip = false }: SectionDividerProps) {
  return (
    <div className={`h-10 w-full sm:h-16 ${base}`} aria-hidden>
      <div
        className={`h-full w-full ${wedge}`}
        style={{
          clipPath: flip
            ? "polygon(0 0, 100% 100%, 0 100%)"
            : "polygon(0 100%, 100% 0, 100% 100%)",
        }}
      />
    </div>
  );
}
