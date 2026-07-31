import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { RegistrationsTable } from "@/app/verify/RegistrationsTable";
import { supabaseServer } from "@/lib/supabase-server";
import { getPaymentProofSignedUrl } from "@/lib/storage";
import { formatIDR } from "@/lib/pricing";
import type { Participant, Registration } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VerifyIndexPage() {
  const { data: registrations } = await supabaseServer
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Registration[]>();

  const { data: participants } = await supabaseServer
    .from("participants")
    .select("*")
    .returns<Participant[]>();

  const participantsByRegistration = new Map<string, Participant[]>();
  for (const p of participants ?? []) {
    const list = participantsByRegistration.get(p.registration_id) ?? [];
    list.push(p);
    participantsByRegistration.set(p.registration_id, list);
  }

  const rows = await Promise.all(
    (registrations ?? []).map(async (r) => ({
      registration: r,
      participants: participantsByRegistration.get(r.id) ?? [],
      proofUrl: r.payment_proof_path ? await getPaymentProofSignedUrl(r.payment_proof_path) : null,
    }))
  );

  const totalParticipants = participants?.length ?? 0;
  const totalCollected = (registrations ?? []).reduce((sum, r) => sum + r.total_amount, 0);
  const totalCheckedIn = (participants ?? []).filter((p) => p.checked_in).length;

  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <p className="font-display text-sm tracking-[0.3em] text-orange">COMMITTEE ONLY</p>
          <h1 className="font-display mt-2 text-3xl text-navy sm:text-4xl">All Registrations</h1>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-navy/10 bg-white px-5 py-4">
              <p className="text-xs text-navy/50">Registrations</p>
              <p className="font-display text-2xl text-navy">{rows.length}</p>
            </div>
            <div className="rounded-xl border border-navy/10 bg-white px-5 py-4">
              <p className="text-xs text-navy/50">Participants</p>
              <p className="font-display text-2xl text-navy">{totalParticipants}</p>
            </div>
            <div className="rounded-xl border border-navy/10 bg-white px-5 py-4">
              <p className="text-xs text-navy/50">Checked In</p>
              <p className="font-display text-2xl text-navy">
                {totalCheckedIn}/{totalParticipants}
              </p>
            </div>
            <div className="rounded-xl border border-navy/10 bg-white px-5 py-4">
              <p className="text-xs text-navy/50">Total Collected</p>
              <p className="font-display text-2xl text-orange">{formatIDR(totalCollected)}</p>
            </div>
          </div>

          <RegistrationsTable rows={rows} />
        </div>
      </main>
      <Footer />
    </>
  );
}
