import type { Metadata } from "next";
import Image from "next/image";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { CHARITY_WALK } from "@/lib/event-config";
import { FunWalkForm } from "./FunWalkForm";

export const metadata: Metadata = {
  title: `${CHARITY_WALK.name} — Paulus Fun Run 2026`,
};

export default function FunWalkPage() {
  return (
    <>
      <NavBar locale="id" />
      <main className="flex-1 bg-cream">
        <section className="bg-navy py-16 text-cream sm:py-20">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-5 text-center sm:flex-row sm:text-left">
            <div className="relative h-56 w-44 flex-shrink-0 sm:h-64 sm:w-52">
              <Image
                src={CHARITY_WALK.guest.photo}
                alt={CHARITY_WALK.guest.name}
                fill
                className="object-contain object-bottom"
              />
            </div>
            <div>
              <p className="font-display text-sm tracking-[0.3em] text-lime">CHARITY</p>
              <h1 className="font-display mt-2 text-4xl sm:text-5xl">{CHARITY_WALK.name}</h1>
              <p className="mt-4 text-cream/80">
                Rangkaian Paulus Fun Run 2026 — jalan bersama lintas agama, tanpa BIB, race pack,
                atau medali. Diikuti bersama:
              </p>
              <p className="font-display mt-4 text-2xl text-lime">{CHARITY_WALK.guest.name}</p>
              <p className="text-cream/70">{CHARITY_WALK.guest.title}</p>
              <p className="mt-4 inline-block rounded-full bg-orange/20 px-4 py-1.5 text-xs font-semibold tracking-wide text-orange">
                SLOT TERBATAS — DAFTAR SEGERA
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
              <span className="text-4xl">🤝</span>
              <p className="font-display mt-3 text-xl text-navy">Kerukunan Antar Umat Beragama</p>
              <p className="mt-2 text-sm text-navy/70">
                Kegiatan ini digagas untuk mempererat kerukunan dan pelayanan antar umat beragama
                di Indonesia.
              </p>
            </div>
            <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
              <span className="text-4xl">🇮🇩</span>
              <p className="font-display mt-3 text-xl text-navy">Didukung Kementerian Agama RI</p>
              <p className="mt-2 text-sm text-navy/70">
                Diselenggarakan bersama GPIB Paulus Jakarta Pusat, didukung penuh oleh
                Kementerian Agama Republik Indonesia.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5 pb-14 sm:pb-20">
          <p className="font-display text-sm tracking-[0.3em] text-orange">PENDAFTARAN</p>
          <h2 className="font-display mt-2 text-3xl text-navy sm:text-4xl">Gabung Fun Walk</h2>
          <p className="mt-4 text-navy/70">Isi form di bawah ini untuk mendaftar.</p>
          <div className="mt-10">
            <FunWalkForm />
          </div>
        </div>
      </main>
      <Footer locale="id" />
    </>
  );
}
