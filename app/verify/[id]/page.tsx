import { notFound } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { supabaseServer } from "@/lib/supabase-server";
import { getPaymentProofSignedUrl } from "@/lib/storage";
import { formatIDR } from "@/lib/pricing";
import type { Participant, Registration } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
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

  const proofUrl = registration.payment_proof_path
    ? await getPaymentProofSignedUrl(registration.payment_proof_path)
    : null;

  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
          <div className="rounded-2xl bg-lime px-6 py-4 text-navy">
            <p className="font-display text-sm tracking-[0.2em]">QR VALID</p>
            <p className="mt-1 font-semibold">Group registered under {registration.contact_name}</p>
          </div>

          <p className="mt-6 text-sm text-navy/60">
            {(participants ?? []).length} participant(s) in this group.
          </p>

          <div className="mt-4 space-y-3">
            {(participants ?? []).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-navy/10 bg-white px-5 py-4"
              >
                <div>
                  <p className="font-semibold text-navy">{p.full_name}</p>
                  <p className="text-sm text-navy/60">
                    {p.category} · {p.gender === "L" ? "Male" : "Female"} · Jersey{" "}
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

          <div className="mt-10 rounded-xl border border-navy/10 bg-white px-5 py-4 text-sm text-navy/70">
            <p className="font-semibold text-navy">Registrant Contact</p>
            <p className="mt-1">{registration.contact_email}</p>
            <p>{registration.contact_phone}</p>
          </div>

          <div className="mt-4 rounded-xl border border-navy/10 bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-navy">Total Payment</p>
              <p className="font-display text-xl text-orange">{formatIDR(registration.total_amount)}</p>
            </div>
            {proofUrl ? (
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-navy underline decoration-lime decoration-2 underline-offset-4"
              >
                View Payment Proof
              </a>
            ) : (
              <p className="mt-2 text-sm text-navy/60">Payment proof not available.</p>
            )}
          </div>

          <Link
            href="/"
            className="mt-10 inline-block font-display text-lg tracking-wide text-navy underline decoration-orange decoration-4 underline-offset-4"
          >
            BACK TO HOME
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
