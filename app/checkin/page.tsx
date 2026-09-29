import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { CheckinClient } from "@/app/checkin/CheckinClient";

export default function CheckinPage() {
  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
          <p className="font-display text-center text-sm tracking-[0.3em] text-orange">RACE DAY</p>
          <h1 className="font-display mt-2 text-center text-3xl text-navy sm:text-4xl">Check In</h1>
          <p className="mt-4 text-center text-navy/70">
            Enter your BIB number to confirm you&apos;re here for race day.
          </p>
          <div className="mt-10">
            <CheckinClient />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
