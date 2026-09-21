import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { AddParticipantForm } from "@/app/verify/tambah-peserta/AddParticipantForm";

export default function AddParticipantPage() {
  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
          <p className="font-display text-sm tracking-[0.3em] text-orange">COMMITTEE ONLY</p>
          <h1 className="font-display mt-2 text-3xl text-navy sm:text-4xl">Add Registration</h1>
          <p className="mt-4 text-navy/70">
            For registrations collected manually (e.g. cash, walk-ins). This creates BIB numbers and
            sends the QR/PDF email exactly like the public form does.
          </p>
          <div className="mt-10">
            <AddParticipantForm />
          </div>
          <Link
            href="/verify"
            className="mt-10 inline-block font-display text-lg tracking-wide text-navy underline decoration-orange decoration-4 underline-offset-4"
          >
            ← BACK TO ALL REGISTRATIONS
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
