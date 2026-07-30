import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { EVENT, CATEGORY_INFO } from "@/lib/event-config";

export default function Home() {
  return (
    <>
      <NavBar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy text-cream">
          <div className="absolute -right-24 -top-24 h-72 w-72 rotate-12 bg-orange/90 sm:h-96 sm:w-96" />
          <div className="absolute -left-32 bottom-0 h-64 w-64 -rotate-12 bg-lime/90 sm:h-80 sm:w-80" />
          <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <p className="font-display text-sm tracking-[0.3em] text-lime sm:text-base">
              {EVENT.church.toUpperCase()} PERSEMBAHKAN
            </p>
            <h1 className="font-display mt-3 text-6xl leading-[0.9] tracking-wide sm:text-8xl">
              <span className="block text-orange">PAULUS</span>
              <span className="block">FUN</span>
              <span className="block text-lime">RUN</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-cream/90 sm:text-lg">
              Lari bareng, sehat bareng, sukacita bareng jemaat dan komunitas.
              Yuk gerak sehat sambil rayakan kebersamaan!
            </p>
            <dl className="mt-8 grid max-w-md grid-cols-2 gap-4 text-sm sm:text-base">
              <div>
                <dt className="text-cream/60">Tanggal</dt>
                <dd className="font-semibold">{EVENT.date}</dd>
              </div>
              <div>
                <dt className="text-cream/60">Waktu</dt>
                <dd className="font-semibold">{EVENT.time}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-cream/60">Titik Kumpul</dt>
                <dd className="font-semibold">{EVENT.meetingPoint}</dd>
              </div>
            </dl>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/daftar"
                className="font-display rounded-full bg-orange px-8 py-4 text-lg tracking-wide text-cream shadow-lg transition hover:bg-orange-dark"
              >
                DAFTAR SEKARANG
              </Link>
              <a
                href="#kategori"
                className="font-display rounded-full border-2 border-cream px-8 py-4 text-lg tracking-wide text-cream transition hover:bg-cream hover:text-navy"
              >
                LIHAT KATEGORI
              </a>
            </div>
          </div>
        </section>

        {/* Tentang */}
        <section id="tentang" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <h2 className="font-display text-4xl text-navy sm:text-5xl">
            Tentang <span className="text-orange">Acara</span>
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-navy/80">
            Paulus Fun Run adalah event lari komunitas yang diselenggarakan oleh{" "}
            {EVENT.church} untuk jemaat, keluarga, dan warga sekitar. Tujuannya
            sederhana: ajak semua orang gerak sehat, bangun kebersamaan, dan
            merayakan sukacita bersama-sama — tanpa perlu jadi atlet dulu.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="skew-block bg-lime p-6">
              <div>
                <p className="font-display text-3xl text-navy">2</p>
                <p className="mt-1 font-semibold text-navy">Kategori Jarak</p>
                <p className="mt-2 text-sm text-navy/70">5K & 10K, cocok untuk semua level.</p>
              </div>
            </div>
            <div className="skew-block bg-orange p-6">
              <div>
                <p className="font-display text-3xl text-cream">QR</p>
                <p className="mt-1 font-semibold text-cream">Race Pack Digital</p>
                <p className="mt-2 text-sm text-cream/85">
                  Daftar sekali, dapat QR code + BIB number otomatis.
                </p>
              </div>
            </div>
            <div className="skew-block bg-navy p-6">
              <div>
                <p className="font-display text-3xl text-lime">1</p>
                <p className="mt-1 font-semibold text-cream">Keluarga Besar</p>
                <p className="mt-2 text-sm text-cream/80">Ajak keluarga & teman, daftar bareng-bareng.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Kategori */}
        <section id="kategori" className="bg-navy py-16 text-cream sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-display text-4xl sm:text-5xl">
              Pilih <span className="text-lime">Kategori</span>
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {CATEGORY_INFO.map((cat, i) => (
                <div
                  key={cat.code}
                  className={`rounded-2xl p-8 ${i === 0 ? "bg-lime text-navy" : "bg-orange text-cream"}`}
                >
                  <p className="font-display text-5xl">{cat.code}</p>
                  <p className="mt-2 text-xl font-semibold">{cat.label}</p>
                  <p className="mt-3 opacity-90">{cat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cara Daftar */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <h2 className="font-display text-4xl text-navy sm:text-5xl">
            Cara <span className="text-orange">Daftar</span>
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Isi Formulir",
                desc: "Isi data kontak & data peserta. Bisa daftar untuk beberapa orang sekaligus.",
              },
              {
                step: "2",
                title: "Dapat QR Code & BIB",
                desc: "Setiap peserta otomatis dapat nomor BIB, dan kamu dapat 1 QR code untuk seluruh grup.",
              },
              {
                step: "3",
                title: "Tunjukkan Saat Race Day",
                desc: "Scan QR code kamu di lokasi untuk ambil race pack — datanya langsung muncul.",
              },
            ].map((item) => (
              <li key={item.step}>
                <span className="font-display text-6xl text-lime [-webkit-text-stroke:2px_var(--color-navy)]">
                  {item.step}
                </span>
                <p className="mt-2 text-xl font-semibold text-navy">{item.title}</p>
                <p className="mt-2 text-navy/70">{item.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
          <h2 className="font-display text-4xl text-navy sm:text-5xl">FAQ</h2>
          <div className="mt-8 divide-y divide-navy/10 border-t border-navy/10">
            {[
              {
                q: "Apakah pendaftaran berbayar?",
                a: "Info biaya pendaftaran akan diumumkan panitia melalui jemaat dan media sosial gereja.",
              },
              {
                q: "Bisa daftar untuk lebih dari 1 orang?",
                a: `Bisa. Saat mengisi formulir, kamu bisa tambahkan beberapa peserta sekaligus (misalnya sekeluarga). Setiap peserta tetap dapat nomor BIB masing-masing, dan kamu akan dapat 1 QR code untuk grup pendaftaranmu.`,
              },
              {
                q: "QR code-nya buat apa?",
                a: "QR code adalah bukti pendaftaran grup kamu. Saat di-scan panitia di race day, data seluruh peserta dalam grupmu akan langsung muncul untuk pengambilan race pack.",
              },
              {
                q: "Sampai kapan pendaftaran dibuka?",
                a: `Pendaftaran ditutup pada ${EVENT.registrationDeadline}, atau lebih cepat bila kuota sudah penuh.`,
              },
            ].map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-navy">
                  {item.q}
                  <span className="text-orange transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-navy/70">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-orange py-16 text-center text-cream sm:py-20">
          <h2 className="font-display text-4xl sm:text-5xl">SIAP UNTUK LARI?</h2>
          <p className="mt-3 text-cream/90">Daftar sekarang, ajak keluarga & sahabat.</p>
          <Link
            href="/daftar"
            className="font-display mt-8 inline-block rounded-full bg-navy px-10 py-4 text-lg tracking-wide text-cream transition hover:bg-navy-light"
          >
            DAFTAR SEKARANG
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
