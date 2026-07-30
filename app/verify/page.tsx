import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
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

          <div className="mt-8 overflow-x-auto rounded-xl border border-navy/10 bg-white">
            <table className="w-full min-w-[1020px] text-left text-sm">
              <thead className="border-b border-navy/10 bg-navy/5 text-xs uppercase tracking-wide text-navy/60">
                <tr>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Participants</th>
                  <th className="px-4 py-3">Checked In</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment Proof</th>
                  <th className="px-4 py-3">PDF</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {rows.map(({ registration, participants: groupParticipants, proofUrl }) => {
                  const checkedInCount = groupParticipants.filter((p) => p.checked_in).length;
                  return (
                    <tr key={registration.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-navy/60">
                        {new Date(registration.created_at).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-navy">{registration.contact_name}</p>
                        <p className="text-xs text-navy/50">{registration.contact_email}</p>
                      </td>
                      <td className="px-4 py-3 text-navy/70">
                        {groupParticipants.map((p) => p.full_name).join(", ") || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-navy/70">
                        {checkedInCount}/{groupParticipants.length}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-navy">
                        {formatIDR(registration.total_amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {proofUrl ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-navy underline decoration-lime decoration-2 underline-offset-4"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-navy/40">Not uploaded</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <a
                          href={`/api/registrations/${registration.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-navy underline decoration-lime decoration-2 underline-offset-4"
                        >
                          View PDF
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/verify/${registration.id}`}
                          className="font-semibold text-orange hover:underline"
                        >
                          View Group →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && (
            <p className="mt-6 text-sm text-navy/60">No registrations yet.</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
