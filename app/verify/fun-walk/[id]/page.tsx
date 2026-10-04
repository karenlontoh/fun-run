import { notFound } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { supabaseServer } from "@/lib/supabase-server";
import { getPaymentProofSignedUrl } from "@/lib/storage";
import { formatIDR } from "@/lib/pricing";
import type { CharityParticipant, CharityRegistration, PaymentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Need Verify",
  verified: "Verified",
  unverified: "Unverified",
};

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  pending: "border-amber-200 bg-amber-100 text-amber-700",
  verified: "border-green-200 bg-green-100 text-green-700",
  unverified: "border-red-200 bg-red-100 text-red-700",
};

export default async function FunWalkGroupPage({
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
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
          <div className="rounded-2xl bg-lime px-6 py-4 text-navy">
            <p className="font-display text-sm tracking-[0.2em]">FUN WALK GROUP</p>
            <p className="mt-1 font-semibold">Group registered under {registration.contact_name}</p>
          </div>

          <p className="mt-6 text-sm text-navy/60">
            {(participants ?? []).length} participant(s) in this group.
          </p>

          <div className="mt-4 space-y-3">
            {(participants ?? []).map((p) => (
              <div key={p.id} className="rounded-xl border border-navy/10 bg-white px-5 py-4">
                <p className="font-semibold text-navy">{p.full_name}</p>
                <p className="text-sm text-navy/60">
                  {p.gender === "L" ? "Male" : "Female"} — {p.institution}
                </p>
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[registration.payment_status]}`}
              >
                {STATUS_LABEL[registration.payment_status]}
              </span>
              {registration.payment_method && (
                <span className="text-xs capitalize text-navy/60">{registration.payment_method}</span>
              )}
            </div>
            <div className="mt-3">
              {proofUrl ? (
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-navy underline decoration-lime decoration-2 underline-offset-4"
                >
                  View Payment Proof
                </a>
              ) : (
                <p className="text-sm text-navy/60">Payment proof not available.</p>
              )}
            </div>
          </div>

          <Link
            href="/verify/fun-walk"
            className="mt-10 inline-block font-display text-lg tracking-wide text-navy underline decoration-orange decoration-4 underline-offset-4"
          >
            ← BACK TO FUN WALK REGISTRATIONS
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
