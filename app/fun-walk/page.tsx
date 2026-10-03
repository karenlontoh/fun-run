import type { Metadata } from "next";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { Reveal } from "@/app/components/Reveal";
import { ParallaxShape } from "@/app/components/ParallaxShape";
import { CHARITY_WALK } from "@/lib/event-config";
import { FunWalkForm } from "./FunWalkForm";

export const metadata: Metadata = {
  title: `${CHARITY_WALK.name} — Paulus Fun Run 2026`,
};

export default function FunWalkPage() {
  return (
    <>
      <NavBar locale="id" />
      <main className="flex-1 overflow-x-clip">
        <section className="relative overflow-hidden bg-navy text-cream">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          >
            <source src="/video/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-navy/75" />
          <ParallaxShape
            className="absolute -right-24 -top-24 h-72 w-72 rotate-12 bg-orange/40 sm:h-96 sm:w-96"
            speed={0.12}
          />
          <ParallaxShape
            className="absolute -left-40 -bottom-24 h-64 w-64 -rotate-12 bg-lime/30 sm:h-80 sm:w-80"
            speed={-0.08}
          />
          <div className="relative mx-auto max-w-4xl px-5 py-20 sm:py-28">
            <Reveal delay={100}>
              <p className="font-display text-sm tracking-[0.3em] text-lime">CHARITY</p>
              <h1 className="font-display mt-2 text-5xl leading-[0.95] sm:text-7xl">
                {CHARITY_WALK.name}
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-5 max-w-xl text-base text-cream/90 sm:text-lg">
                Jalan santai sejauh 1,5 km bersama lintas agama, tanpa BIB, race pack, atau
                medali. Diikuti bersama:
              </p>
              <p className="font-display mt-4 text-2xl text-lime">{CHARITY_WALK.guest.name}</p>
              <p className="text-cream/70">{CHARITY_WALK.guest.title}</p>
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-6 inline-block rounded-full bg-orange/20 px-4 py-1.5 text-xs font-semibold tracking-wide text-orange">
                SLOT TERBATAS — DAFTAR SEGERA
              </p>
            </Reveal>
            <Reveal delay={400}>
              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="#daftar"
                  className="font-display rounded-full bg-orange px-8 py-4 text-lg tracking-wide text-cream shadow-lg transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-orange-dark hover:shadow-xl active:translate-y-0 active:scale-100"
                >
                  DAFTAR SEKARANG
                </a>
              </div>
            </Reveal>
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

        <div id="daftar" className="mx-auto max-w-3xl px-5 pb-14 sm:pb-20">
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
