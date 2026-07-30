import Link from "next/link";

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-navy text-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-xl tracking-wide sm:text-2xl">
          PAULUS FUN RUN
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold sm:gap-6 sm:text-base">
          <Link href="/#tentang" className="hidden hover:text-lime sm:inline">
            Tentang
          </Link>
          <Link href="/#kategori" className="hidden hover:text-lime sm:inline">
            Kategori
          </Link>
          <Link href="/#faq" className="hidden hover:text-lime sm:inline">
            FAQ
          </Link>
          <Link
            href="/daftar"
            className="rounded-full bg-orange px-4 py-2 font-display tracking-wide text-cream transition hover:bg-orange-dark sm:px-5"
          >
            DAFTAR
          </Link>
        </nav>
      </div>
    </header>
  );
}
