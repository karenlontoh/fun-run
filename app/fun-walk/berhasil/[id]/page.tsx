import { notFound } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { supabaseServer } from "@/lib/supabase-server";
import { getPaymentProofSignedUrl } from "@/lib/storage";
import { formatIDR } from "@/lib/pricing";
import { CHARITY_WALK } from "@/lib/event-config";
import type { CharityParticipant, CharityRegistration } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FunWalkSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: registration } = await supabaseServer
    .from("charity_registrations")
    .select("*")
    .eq("id", id)
    .single<CharityRegistration>();

  if (!registration) {
    notFound();
  }

  const { data: participants } = await supabaseServer
    .from("charity_participants")
    .select("*")
    .eq("registration_id", id)
    .returns<CharityParticipant[]>();

  const proofUrl = registration.payment_proof_path
    ? await getPaymentProofSignedUrl(registration.payment_proof_path)
    : null;

  return (
    <>
      <NavBar locale="id" />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-2xl px-5 py-14 text-center sm:py-20">
          <p className="font-display text-sm tracking-[0.3em] text-lime-dark">
            PENDAFTARAN BERHASIL
          </p>
          <h1 className="font-display mt-2 text-4xl text-navy sm:text-5xl">Sampai Jumpa di Sana!</h1>
          <p className="mx-auto mt-4 max-w-lg text-navy/70">
            Terima kasih telah bergabung dengan {CHARITY_WALK.name} bersama {CHARITY_WALK.guest.name}.
            Tidak ada BIB atau race pack untuk sesi ini — cukup datang dan jalan bersama kami.
          </p>
          <p className="mt-4 text-xs text-navy/50">ID Registrasi: {id}</p>

          <div className="mt-10 text-left">
            <h2 className="font-display text-2xl text-navy">Peserta Terdaftar</h2>
            <div className="mt-4 space-y-3">
              {(participants ?? []).map((p) => (
                <div key={p.id} className="rounded-xl border border-navy/10 bg-white px-5 py-4">
                  <p className="font-semibold text-navy">{p.full_name}</p>
                  <p className="text-sm text-navy/60">{p.gender === "L" ? "Laki-laki" : "Perempuan"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-navy/10 bg-white px-6 py-5 text-left">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-navy">Total Pembayaran</p>
              <p className="font-display text-2xl text-orange">{formatIDR(registration.total_amount)}</p>
            </div>
            {proofUrl ? (
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-navy underline decoration-lime decoration-2 underline-offset-4"
              >
                Lihat bukti pembayaran yang kamu unggah
              </a>
            ) : (
              <p className="mt-2 text-sm text-navy/60">Bukti pembayaran tidak tersedia.</p>
            )}
            <p className="mt-2 text-xs text-navy/50">
              Panitia akan memverifikasi pembayaran kamu sebelum acara berlangsung.
            </p>
          </div>

          <Link
            href="/"
            className="mt-12 inline-block font-display text-lg tracking-wide text-navy underline decoration-orange decoration-4 underline-offset-4"
          >
            KEMBALI KE BERANDA
          </Link>
        </div>
      </main>
      <Footer locale="id" />
    </>
  );
}
