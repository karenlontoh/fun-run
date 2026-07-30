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
          <a href={`mailto:${EVENT.contactEmail}`} className="hover:text-lime">
            {EVENT.contactEmail}
          </a>
          <span>{EVENT.contactPhone}</span>
          <a
            href={`https://instagram.com/${EVENT.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-lime"
          >
            Instagram {EVENT.instagram}
          </a>
        </div>
        <p className="mt-8 border-t border-cream/10 pt-6 text-xs text-cream/50">
          © {new Date().getFullYear()} {EVENT.church}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
