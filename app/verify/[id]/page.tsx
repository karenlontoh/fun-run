import { notFound } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { ParticipantEditor } from "@/app/components/ParticipantEditor";
import { PaymentEditor } from "@/app/components/PaymentEditor";
import { supabaseServer } from "@/lib/supabase-server";
import { getPaymentProofSignedUrl } from "@/lib/storage";
import type { Participant, Registration } from "@/lib/types";

export const dynamic = "force-dynamic";

async function OrderView({ registration }: { registration: Registration }) {
  const { data: participants } = await supabaseServer
    .from("participants")
    .select("*")
    .eq("registration_id", registration.id)
    .order("bib_number", { ascending: true })
    .returns<Participant[]>();

  const proofUrl = registration.payment_proof_path
    ? await getPaymentProofSignedUrl(registration.payment_proof_path)
    : null;

  return (
    <>
      <div className="rounded-2xl bg-lime px-6 py-4 text-navy">
        <p className="font-display text-sm tracking-[0.2em]">GROUP QR VALID</p>
        <p className="mt-1 font-semibold">Group registered under {registration.contact_name}</p>
      </div>

      <p className="mt-6 text-sm text-navy/60">
        {(participants ?? []).length} participant(s) in this group.
      </p>

      <div className="mt-4 space-y-3">
        {(participants ?? []).map((p) => (
          <ParticipantEditor key={p.id} participant={p} />
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-navy/10 bg-white px-5 py-4 text-sm text-navy/70">
        <p className="font-semibold text-navy">Registrant Contact</p>
        <p className="mt-1">{registration.contact_email}</p>
        <p>{registration.contact_phone}</p>
      </div>

      <PaymentEditor
        registrationId={registration.id}
        totalAmount={registration.total_amount}
        initialStatus={registration.payment_status}
        initialMethod={registration.payment_method}
        proofUrl={proofUrl}
      />
    </>
  );
}

function PersonalView({
  participant,
  registration,
}: {
  participant: Participant;
  registration: Registration;
}) {
  return (
    <>
      <div className="rounded-2xl bg-lime px-6 py-4 text-navy">
        <p className="font-display text-sm tracking-[0.2em]">PERSONAL QR VALID</p>
        <p className="mt-1 font-semibold">{participant.full_name}</p>
      </div>

      <div className="mt-6">
        <ParticipantEditor participant={participant} />
      </div>

      <div className="mt-10 rounded-xl border border-navy/10 bg-white px-5 py-4 text-sm text-navy/70">
        <p className="font-semibold text-navy">Part of Group Registered By</p>
        <p className="mt-1">{registration.contact_name}</p>
        <p>{registration.contact_email}</p>
        <p>{registration.contact_phone}</p>
      </div>
    </>
  );
}

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

  let personal: { participant: Participant; registration: Registration } | null = null;
  if (!registration) {
    const { data: participant } = await supabaseServer
      .from("participants")
      .select("*")
      .eq("id", id)
      .single<Participant>();

    if (!participant) {
      notFound();
    }

    const { data: parentRegistration } = await supabaseServer
      .from("registrations")
      .select("*")
      .eq("id", participant.registration_id)
      .single<Registration>();

    if (!parentRegistration) {
      notFound();
    }

    personal = { participant, registration: parentRegistration };
  }

  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
          {registration ? (
            <OrderView registration={registration} />
          ) : (
            personal && <PersonalView participant={personal.participant} registration={personal.registration} />
          )}

          <Link
            href="/verify"
            className="mt-10 inline-block font-display text-lg tracking-wide text-navy underline decoration-orange decoration-4 underline-offset-4"
          >
            ← BACK TO ALL REGISTRATIONS
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
