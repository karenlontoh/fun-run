import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { Reveal } from "@/app/components/Reveal";
import { ParallaxShape } from "@/app/components/ParallaxShape";
import { TiltCard } from "@/app/components/TiltCard";
import { MarqueeBanner } from "@/app/components/MarqueeBanner";
import { SectionDivider } from "@/app/components/SectionDivider";
import { EVENT, CATEGORY_INFO, BENEFITS, TICKER_TEXT } from "@/lib/event-config";
import { formatIDR } from "@/lib/pricing";

export default function Home() {
  return (
    <>
      <NavBar />
      <main className="flex-1 overflow-x-clip">
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy text-cream">
          <ParallaxShape
            className="absolute -right-24 -top-24 h-72 w-72 rotate-12 bg-orange/90 sm:h-96 sm:w-96"
            speed={0.12}
          />
          <ParallaxShape
            className="absolute -left-32 bottom-0 h-64 w-64 -rotate-12 bg-lime/90 sm:h-80 sm:w-80"
            speed={-0.08}
          />
          <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <Reveal delay={100}>
              <h1 className="font-display text-6xl leading-[0.82] tracking-normal sm:text-8xl">
                <span className="block text-orange">PAULUS</span>
                <span className="block">
                  FUN <span className="text-lime">RUN</span>
                </span>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="font-display mt-4 text-xl tracking-wide text-lime sm:text-2xl">
                {EVENT.tagline.toUpperCase()}
              </p>
              <p className="mt-4 max-w-xl text-base text-cream/90 sm:text-lg">
                Two distances, one big celebration, zero pressure. Whether you&apos;re taking the
                2.5K or pushing for the 5K, this is a fun, non-competitive run — walk it, jog it,
                or run it. Join the {EVENT.church} community for a morning of movement, faith, and
                fun, with an exclusive jersey and full race pack for every runner.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <dl className="mt-8 grid max-w-md grid-cols-2 gap-4 text-sm sm:text-base">
                <div>
                  <dt className="text-cream/60">Date</dt>
                  <dd className="font-semibold">{EVENT.date}</dd>
                </div>
                <div>
                  <dt className="text-cream/60">Time</dt>
                  <dd className="font-semibold">{EVENT.time}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-cream/60">Venue</dt>
                  <dd className="font-semibold">{EVENT.meetingPoint}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-cream/60">Registration Period</dt>
                  <dd className="font-semibold">
                    {EVENT.registrationOpen} — {EVENT.registrationClose}
                  </dd>
                </div>
              </dl>
            </Reveal>
            <Reveal delay={400}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/daftar"
                  className="font-display rounded-full bg-orange px-8 py-4 text-lg tracking-wide text-cream shadow-lg transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-orange-dark hover:shadow-xl active:translate-y-0 active:scale-100"
                >
                  REGISTER NOW
                </Link>
                <a
                  href="#kategori"
                  className="font-display rounded-full border-2 border-cream px-8 py-4 text-lg tracking-wide text-cream transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-cream hover:text-navy active:translate-y-0 active:scale-100"
                >
                  VIEW CATEGORIES
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Categories */}
        <section id="kategori" className="bg-navy py-16 text-cream sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <h2 className="font-display text-4xl sm:text-5xl">
                Choose Your <span className="text-lime">Category</span>
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {CATEGORY_INFO.map((cat, i) => (
                <Reveal key={cat.code} delay={i * 120}>
                  <TiltCard
                    className={`rounded-2xl p-8 ${i === 0 ? "bg-lime text-navy" : "bg-orange text-cream"}`}
                  >
                    <div className="flex items-baseline justify-between">
                      <p className="font-display text-5xl">{cat.code}</p>
                      <p className="font-display text-2xl">{formatIDR(cat.price)}</p>
                    </div>
                    <p className="mt-2 text-xl font-semibold">{cat.label}</p>
                    <p className="mt-3 opacity-90">{cat.description}</p>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <MarqueeBanner text={TICKER_TEXT} />
        <SectionDivider base="bg-orange" wedge="bg-cream" />

        {/* Benefits */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <Reveal>
            <h2 className="font-display text-4xl text-navy sm:text-5xl">
              What You&apos;ll <span className="text-orange">Get</span>
            </h2>
            <p className="mt-3 max-w-xl text-navy/70">
              This isn&apos;t a race against the clock — it&apos;s a celebration on foot. Every
              runner, no matter the pace, walks away with:
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={i * 100}>
                <TiltCard className="h-full rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
                  <span
                    className="animate-float inline-block text-4xl"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    {b.icon}
                  </span>
                  <p className="font-display mt-3 text-2xl text-orange">{b.title}</p>
                  <p className="mt-2 text-sm text-navy/70">{b.description}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
          <Reveal>
            <h2 className="font-display text-4xl text-navy sm:text-5xl">FAQ</h2>
          </Reveal>
          <div className="mt-8 divide-y divide-navy/10 border-t border-navy/10">
            {[
              {
                q: "Is this a competitive race?",
                a: "Not at all! Paulus Fun Run is fun and non-competitive — there's no clock to beat and no pressure. Walk it, jog it, or run it, and enjoy the morning at whatever pace feels good.",
              },
              {
                q: "Is registration paid?",
                a: `Yes. The ${CATEGORY_INFO[0].code} category is ${formatIDR(CATEGORY_INFO[0].price)} and ${CATEGORY_INFO[1].code} is ${formatIDR(CATEGORY_INFO[1].price)}, including a race pack (jersey & BIB number), refreshments, medal, and entertainment.`,
              },
              {
                q: "Can I register more than one person?",
                a: "Yes. When filling out the form, you can add multiple participants at once (for example, your whole family). Each participant still gets their own BIB number, and you'll receive one QR code for your group registration.",
              },
              {
                q: "What's the QR code for?",
                a: "The QR code is proof of your group's registration. When scanned by the committee on race day, all participants in your group will appear instantly for race pack collection.",
              },
              {
                q: "What should I bring on race day?",
                a: "Comfortable shoes and a water bottle are all you really need — your race pack (jersey, BIB, and everything else) is already covered.",
              },
              {
                q: "When does registration close?",
                a: `Registration is open from ${EVENT.registrationOpen} to ${EVENT.registrationClose}, or earlier if slots run out.`,
              },
            ].map((item, i) => (
              <Reveal key={item.q} delay={i * 60}>
                <details className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-navy">
                    {item.q}
                    <span className="text-orange transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-navy/70">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        <SectionDivider base="bg-cream" wedge="bg-orange" flip />

        {/* CTA */}
        <section className="bg-orange py-16 text-center text-cream sm:py-20">
          <Reveal>
            <h2 className="font-display text-4xl sm:text-5xl">READY TO RUN?</h2>
            <p className="mt-3 text-cream/90">Register now and bring your family &amp; friends along.</p>
            <Link
              href="/daftar"
              className="font-display mt-8 inline-block rounded-full bg-navy px-10 py-4 text-lg tracking-wide text-cream shadow-lg transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-navy-light hover:shadow-xl active:translate-y-0 active:scale-100"
            >
              REGISTER NOW
            </Link>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
