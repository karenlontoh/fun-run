import type { Metadata } from "next";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { EVENT, isRegistrationClosed } from "@/lib/event-config";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Register — Paulus Fun Run 2026",
};

export default function DaftarPage() {
  const closed = isRegistrationClosed();

  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
          <p className="font-display text-sm tracking-[0.3em] text-orange">REGISTRATION</p>
          <h1 className="font-display mt-2 text-4xl text-navy sm:text-5xl">Register for the Fun Run</h1>
          {closed ? (
            <div className="mt-10 rounded-2xl border border-navy/10 bg-white px-6 py-10 text-center">
              <p className="font-display text-2xl text-orange">Registration Is Closed</p>
              <p className="mt-3 text-navy/70">
                Registration for {EVENT.name} closed on {EVENT.registrationClose}. Thanks to
                everyone who signed up — see you on race day!
              </p>
            </div>
          ) : (
            <>
              <p className="mt-4 text-navy/70">Fill out the form below to register.</p>
              <div className="mt-10">
                <RegisterForm />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
