"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/pricing";
import type { Participant, Registration } from "@/lib/types";

type Row = {
  registration: Registration;
  participants: Participant[];
  proofUrl: string | null;
};

export function RegistrationsTable({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(({ participants }) =>
      participants.some((p) => p.full_name.toLowerCase().includes(query))
    );
  }, [rows, search]);

  return (
    <>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by participant name..."
        className="mt-8 w-full max-w-sm rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm text-navy placeholder:text-navy/40 focus:border-orange focus:outline-none"
      />

      <div className="mt-4 overflow-x-auto rounded-xl border border-navy/10 bg-white">
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
            {filteredRows.map(({ registration, participants: groupParticipants, proofUrl }) => {
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

      {rows.length > 0 && filteredRows.length === 0 && (
        <p className="mt-6 text-sm text-navy/60">No participants match &quot;{search}&quot;.</p>
      )}
      {rows.length === 0 && <p className="mt-6 text-sm text-navy/60">No registrations yet.</p>}
    </>
  );
}
