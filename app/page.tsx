import Link from "next/link";
import Image from "next/image";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { Reveal } from "@/app/components/Reveal";
import { ParallaxShape } from "@/app/components/ParallaxShape";
import { TiltCard } from "@/app/components/TiltCard";
import { MarqueeBanner } from "@/app/components/MarqueeBanner";
import { Eyebrow } from "@/app/components/Eyebrow";
import { RouteMap } from "@/app/components/RouteMap";
import { SizeChartTable } from "@/app/components/SizeChartTable";
import { EVENT, BENEFITS, JERSEYS, TICKER_TEXT, isRegistrationClosed } from "@/lib/event-config";
import route5k from "@/lib/routes-5k.json";
import route2_5k from "@/lib/routes-2.5k.json";

const ROUTES = [
  {
    category: "5K",
    points: route5k as [number, number][],
    color: "#c3ea41",
    waterStations: [
      [-6.187043, 106.835467],
      [-6.19447491, 106.829361945],
    ] as [number, number][],
  },
  {
    category: "2.5K",
    points: route2_5k as [number, number][],
    color: "#fe572a",
    waterStations: [[-6.190628, 106.83306]] as [number, number][],
  },
];


const RACE_DAY_TIMELINE = [
  {
    time: EVENT.gatesOpen,
    title: "Gathering & Race Pack Collection",
    description: "Arrive, check in with your QR code, and collect your jersey and race pack.",
  },
  {
    time: EVENT.time.split("—")[0].trim(),
    title: "Flag Off",
    description: "Everyone starts together — walk it, jog it, or run it, at your own pace.",
  },
  {
    time: "Anytime after",
    title: "Finish & Celebration",
    description: "Cross the line for your medal, then stay for refreshments and entertainment.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is this a competitive race?",
    a: "Not at all! Paulus Fun Run is fun and non-competitive — there's no clock to beat and no pressure. Walk it, jog it, or run it, and enjoy the morning at whatever pace feels good.",
  },
  {
    q: "What's the QR code for?",
    a: "The QR code is proof of your group's registration. When scanned by the committee on race day, all participants in your group will appear instantly for race pack collection.",
  },
  {
    q: "What should I bring on race day?",
    a: "Comfortable shoes and a water bottle are all you really need — your race pack (jersey, BIB, and everything else) is already covered.",
  },
];

export default function Home() {
  const closed = isRegistrationClosed();

  return (
    <>
      <NavBar />
      <main className="flex-1 overflow-x-clip">
        {/* Hero */}
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
          <div className="absolute inset-0 bg-navy/60" />
          <ParallaxShape
            className="absolute -right-24 -top-24 h-72 w-72 rotate-12 bg-orange/90 sm:h-96 sm:w-96"
            speed={0.12}
          />
          <ParallaxShape
            className="absolute -left-32 bottom-0 h-64 w-64 -rotate-12 bg-lime/90 sm:h-80 sm:w-80"
            speed={-0.08}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 select-none font-display text-[9rem] leading-none text-cream/5 sm:text-[14rem]"
          >
            26
          </span>
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
              <p className="mt-4 max-w-4xl text-base text-cream/90 sm:text-lg">
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
                  <dt className="text-cream/60">Race Pack Collection</dt>
                  <dd className="font-semibold">
                    {EVENT.racePackCollectionDates}, {EVENT.racePackCollectionTime} at{" "}
                    {EVENT.racePackCollectionVenue}
                  </dd>
                </div>
              </dl>
            </Reveal>
            {!closed && (
              <Reveal delay={400}>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/daftar"
                    className="font-display rounded-full bg-orange px-8 py-4 text-lg tracking-wide text-cream shadow-lg transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-orange-dark hover:shadow-xl active:translate-y-0 active:scale-100"
                  >
                    REGISTER NOW
                  </Link>
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {/* Race Pack Collection */}
        <section className="bg-navy py-16 text-cream sm:py-24">
          <div className="mx-auto max-w-4xl px-5">
            <Reveal>
              <Eyebrow index="01" label="RACE PACK COLLECTION" className="text-lime" />
              <h2 className="font-display mt-4 text-4xl sm:text-5xl">Collect Your Race Pack</h2>
              <p className="mt-3 max-w-xl text-cream/70">
                Bring your QR code and come collect your jersey and race pack before race day.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-cream/15 bg-white/5 px-5 py-4">
                  <p className="text-xs text-cream/50">Dates</p>
                  <p className="mt-1 font-semibold">{EVENT.racePackCollectionDates}</p>
                </div>
                <div className="rounded-2xl border border-cream/15 bg-white/5 px-5 py-4">
                  <p className="text-xs text-cream/50">Time</p>
                  <p className="mt-1 font-semibold">{EVENT.racePackCollectionTime}</p>
                </div>
                <div className="rounded-2xl border border-cream/15 bg-white/5 px-5 py-4">
                  <p className="text-xs text-cream/50">Venue</p>
                  <p className="mt-1 font-semibold">{EVENT.racePackCollectionVenue}</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-8 rounded-2xl border border-orange/40 bg-orange/10 px-6 py-5">
                <p className="font-semibold text-orange">Can&apos;t collect it yourself?</p>
                <p className="mt-1 text-sm text-cream/80">
                  Someone else can collect on your behalf if they bring a signed authorization
                  letter (Surat Kuasa), along with a copy of their ID and your payment proof.
                </p>
                <a
                  href="/documents/surat-kuasa-paulus-fun-run-2026.docx"
                  className="mt-4 inline-block rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-orange-dark"
                >
                  Download Surat Kuasa
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        <MarqueeBanner text={TICKER_TEXT} />

        {/* Official Jersey */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <Reveal>
            <Eyebrow index="02" label="OFFICIAL JERSEY" className="text-orange" />
            <h2 className="font-display mt-4 text-4xl text-navy sm:text-5xl">
              This Year&apos;s <span className="text-orange">Jersey</span>
            </h2>
            <p className="mt-3 max-w-xl text-navy/70">
              Every runner gets to keep their jersey — the color tells your category apart on
              race day.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {JERSEYS.map((jersey, i) => (
              <Reveal key={jersey.category} delay={i * 120}>
                <TiltCard className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
                  <p
                    className={`font-display text-3xl ${
                      jersey.accent === "lime" ? "text-lime-dark" : "text-orange"
                    }`}
                  >
                    {jersey.category}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-navy/5">
                      <Image
                        src={jersey.front}
                        alt={`${jersey.category} jersey — front`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, 260px"
                      />
                    </div>
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-navy/5">
                      <Image
                        src={jersey.back}
                        alt={`${jersey.category} jersey — back`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, 260px"
                      />
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
          <Reveal delay={240}>
            <div className="mx-auto mt-8 max-w-xl">
              <SizeChartTable />
            </div>
          </Reveal>
        </section>

        {/* Route */}
        <section className="bg-navy py-16 text-cream sm:py-24">
          <div className="mx-auto max-w-4xl px-5">
            <Reveal>
              <Eyebrow index="03" label="THE ROUTE" className="text-lime" />
              <h2 className="font-display mt-4 text-4xl sm:text-5xl">Where You&apos;ll Run</h2>
              <p className="mt-3 max-w-xl text-cream/70">
                Both routes start and finish at {EVENT.church}, looping through the
                neighborhood streets around the church grounds.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              {ROUTES.map((route, i) => (
                <Reveal key={route.category} delay={i * 120}>
                  <p
                    className={`font-display text-2xl ${
                      route.category === "5K" ? "text-lime" : "text-orange"
                    }`}
                  >
                    {route.category}
                  </p>
                  <div className="relative mt-4 aspect-square overflow-hidden rounded-2xl border border-cream/15">
                    <RouteMap
                      points={route.points}
                      color={route.color}
                      waterStations={route.waterStations}
                    />
                    <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] space-y-1 rounded-lg bg-navy/85 px-3 py-2 text-xs font-semibold text-cream backdrop-blur-sm">
                      <p className="flex items-center gap-1.5">
                        <span>🏁</span> Start / Finish
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span>💧</span> Water Station
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <Reveal>
            <Eyebrow index="04" label="WHAT YOU'LL GET" className="text-orange" />
            <h2 className="font-display mt-4 text-4xl text-navy sm:text-5xl">
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

        {/* Race Day Timeline */}
        <section className="bg-navy py-16 text-cream sm:py-24">
          <div className="mx-auto max-w-4xl px-5">
            <Reveal>
              <Eyebrow index="05" label="RACE DAY" className="text-lime" />
              <h2 className="font-display mt-4 text-4xl sm:text-5xl">What To Expect</h2>
            </Reveal>
            <div className="mt-12 space-y-8 border-l-2 border-cream/20 pl-8">
              {RACE_DAY_TIMELINE.map((item, i) => (
                <Reveal key={item.title} delay={i * 100}>
                  <p className="font-display text-lime">{item.time}</p>
                  <p className="mt-1 text-xl font-semibold">{item.title}</p>
                  <p className="mt-1 text-cream/70">{item.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
          <Reveal>
            <Eyebrow index="06" label="FAQ" className="text-orange" />
            <h2 className="font-display mt-4 text-4xl text-navy sm:text-5xl">
              Frequently Asked Questions
            </h2>
          </Reveal>
          <div className="mt-8 divide-y divide-navy/10 border-t border-navy/10">
            {FAQ_ITEMS.map((item, i) => (
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

        {/* CTA */}
        <section className="bg-orange py-16 text-center text-cream sm:py-20">
          <Reveal>
            <h2 className="font-display text-4xl sm:text-5xl">
              {closed ? "SEE YOU ON RACE DAY!" : "READY TO RUN?"}
            </h2>
            {closed ? (
              <p className="mt-3 text-cream/90">Registration is now closed. Thanks to everyone who signed up!</p>
            ) : (
              <>
                <p className="mt-3 text-cream/90">Register now and bring your family &amp; friends along.</p>
                <Link
                  href="/daftar"
                  className="font-display mt-8 inline-block rounded-full bg-navy px-10 py-4 text-lg tracking-wide text-cream shadow-lg transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-navy-light hover:shadow-xl active:translate-y-0 active:scale-100"
                >
                  REGISTER NOW
                </Link>
              </>
            )}
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
