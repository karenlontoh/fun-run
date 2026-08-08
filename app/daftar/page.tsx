import type { Metadata } from "next";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Register — Paulus Fun Run 2026",
};

export default function DaftarPage() {
  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
          <p className="font-display text-sm tracking-[0.3em] text-orange">REGISTRATION</p>
          <h1 className="font-display mt-2 text-4xl text-navy sm:text-5xl">Register for the Fun Run</h1>
          <p className="mt-4 text-navy/70">
            Fill out the form below to register.
          </p>
          <div className="mt-10">
            <RegisterForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
