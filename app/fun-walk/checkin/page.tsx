import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { FunWalkCheckinClient } from "@/app/fun-walk/checkin/FunWalkCheckinClient";

export default function FunWalkCheckinPage() {
  return (
    <>
      <NavBar locale="id" />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-xl px-5 py-14 sm:py-20">
          <p className="font-display text-center text-sm tracking-[0.3em] text-orange">HARI-H</p>
          <h1 className="font-display mt-2 text-center text-3xl text-navy sm:text-4xl">
            Check In
          </h1>
          <p className="mt-4 text-center text-navy/70">
            Cari namamu untuk konfirmasi kehadiran hari ini.
          </p>
          <div className="mt-10">
            <FunWalkCheckinClient />
          </div>
        </div>
      </main>
      <Footer locale="id" />
    </>
  );
}
