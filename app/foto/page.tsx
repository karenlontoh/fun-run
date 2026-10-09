import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { FotoSearchClient } from "@/app/foto/FotoSearchClient";

export default function FotoPage() {
  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
          <p className="font-display text-center text-sm tracking-[0.3em] text-orange">
            RACE PHOTOS
          </p>
          <h1 className="font-display mt-2 text-center text-3xl text-navy sm:text-4xl">
            Find Your Photos
          </h1>
          <p className="mt-4 text-center text-navy/70">
            Enter your BIB number to find race-day photos you&apos;re in.
          </p>
          <div className="mt-10">
            <FotoSearchClient />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
