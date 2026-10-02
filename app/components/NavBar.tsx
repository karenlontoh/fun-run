import Link from "next/link";
import Image from "next/image";
import { hasLogo } from "@/lib/has-logo";
import { ScrollShadowHeader } from "@/app/components/ScrollShadowHeader";
import { isRegistrationClosed } from "@/lib/event-config";

type Locale = "en" | "id";

const LABELS: Record<Locale, { faq: string; register: string; closed: string }> = {
  en: { faq: "FAQ", register: "REGISTER", closed: "CLOSED" },
  id: { faq: "FAQ", register: "DAFTAR", closed: "DITUTUP" },
};

export function NavBar({ locale = "en" }: { locale?: Locale }) {
  const closed = isRegistrationClosed();
  const t = LABELS[locale];

  return (
    <ScrollShadowHeader>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center">
          {hasLogo() && (
            <Image
              src="/logo.png"
              alt="Paulus Fun Run"
              width={220}
              height={172}
              className="h-10 w-auto sm:h-12"
            />
          )}
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold sm:gap-6 sm:text-base">
          <Link href="/#faq" className="hidden hover:text-lime sm:inline">
            {t.faq}
          </Link>
          {closed ? (
            <span
              className="cursor-not-allowed rounded-full bg-navy/10 px-4 py-2 font-display tracking-wide text-navy/40 sm:px-5"
              aria-disabled="true"
            >
              {t.closed}
            </span>
          ) : (
            <Link
              href="/daftar"
              className="rounded-full bg-orange px-4 py-2 font-display tracking-wide text-cream transition hover:bg-orange-dark sm:px-5"
            >
              {t.register}
            </Link>
          )}
        </nav>
      </div>
    </ScrollShadowHeader>
  );
}
