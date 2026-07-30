import { EVENT } from "@/lib/event-config";

export function Footer() {
  return (
    <footer className="mt-auto bg-navy text-cream">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <p className="font-display text-2xl tracking-wide">PAULUS FUN RUN</p>
        <p className="mt-2 max-w-md text-sm text-cream/80">
          Organized by {EVENT.church}.
          <br />
          {EVENT.address}.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-cream/80">
          <span>{EVENT.contactEmail}</span>
          <span>{EVENT.contactPhone}</span>
          <span>Instagram {EVENT.instagram}</span>
        </div>
        <p className="mt-8 text-xs text-cream/50">
          © {new Date().getFullYear()} {EVENT.church}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
