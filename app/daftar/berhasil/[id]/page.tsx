import { notFound } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { supabaseServer } from "@/lib/supabase-server";
import { generateQrDataUrl } from "@/lib/qrcode";
import { verifyUrl } from "@/lib/site";
import type { Participant, Registration } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RegistrationSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: registration } = await supabaseServer
    .from("registrations")
    .select("*")
    .eq("id", id)
    .single<Registration>();

  if (!registration) {
    notFound();
  }

  const { data: participants } = await supabaseServer
    .from("participants")
    .select("*")
    .eq("registration_id", id)
    .order("bib_number", { ascending: true })
    .returns<Participant[]>();

  const qrDataUrl = await generateQrDataUrl(verifyUrl(id));

  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:py-20">
          <p className="font-display text-sm tracking-[0.3em] text-lime-dark">
            PENDAFTARAN BERHASIL
          </p>
          <h1 className="font-display mt-2 text-4xl text-navy sm:text-5xl">
            Sampai Jumpa di Race Day!
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-navy/70">
            Simpan atau screenshot QR code di bawah ini. Tunjukkan QR ini saat pengambilan race
            pack — data seluruh peserta di grup ini akan langsung muncul.
          </p>

          <div className="mx-auto mt-10 w-fit rounded-3xl border border-navy/10 bg-white p-8 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code pendaftaran" width={240} height={240} className="mx-auto" />
            <p className="mt-4 text-xs text-navy/50">ID Pendaftaran: {id}</p>
            <a
              href={qrDataUrl}
              download={`paulus-fun-run-${id}.png`}
              className="mt-4 inline-block rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-navy-light"
            >
              Unduh QR Code
            </a>
          </div>

          <div className="mt-12 text-left">
            <h2 className="font-display text-2xl text-navy">Peserta Terdaftar</h2>
            <div className="mt-4 space-y-3">
              {(participants ?? []).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-navy/10 bg-white px-5 py-4"
                >
                  <div>
                    <p className="font-semibold text-navy">{p.full_name}</p>
                    <p className="text-sm text-navy/60">
                      {p.category} · {p.gender === "L" ? "Laki-laki" : "Perempuan"} · Jersey{" "}
                      {p.jersey_size}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-navy/50">BIB</p>
                    <p className="font-display text-2xl text-orange">{p.bib_number}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/"
            className="mt-12 inline-block font-display text-lg tracking-wide text-navy underline decoration-orange decoration-4 underline-offset-4"
          >
            KEMBALI KE BERANDA
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
