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

type SortOption = "newest" | "unverified" | "verified";

export function RegistrationsTable({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rows.map((r) => [r.registration.id, r.registration.payment_verified]))
  );
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});

  async function toggleVerified(id: string, next: boolean) {
    const previous = verifiedMap[id];
    setVerifiedMap((prev) => ({ ...prev, [id]: next }));
    setPendingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/registrations/${id}/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: next }),
      });
      if (!res.ok) {
        setVerifiedMap((prev) => ({ ...prev, [id]: previous }));
      }
    } catch {
      setVerifiedMap((prev) => ({ ...prev, [id]: previous }));
    } finally {
      setPendingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(({ participants }) =>
      participants.some((p) => p.full_name.toLowerCase().includes(query))
    );
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    if (sortBy === "newest") return filteredRows;
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      const aVerified = verifiedMap[a.registration.id] ? 1 : 0;
      const bVerified = verifiedMap[b.registration.id] ? 1 : 0;
      return sortBy === "unverified" ? aVerified - bVerified : bVerified - aVerified;
    });
    return sorted;
  }, [filteredRows, sortBy, verifiedMap]);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by participant name..."
          className="w-full max-w-sm rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm text-navy placeholder:text-navy/40 focus:border-orange focus:outline-none"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm text-navy focus:border-orange focus:outline-none"
        >
          <option value="newest">Sort: Newest First</option>
          <option value="unverified">Sort: Unverified First</option>
          <option value="verified">Sort: Verified First</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-navy/10 bg-white">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b border-navy/10 bg-navy/5 text-xs uppercase tracking-wide text-navy/60">
            <tr>
              <th className="px-4 py-3">Verified</th>
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
            {sortedRows.map(({ registration, participants: groupParticipants, proofUrl }) => {
              const checkedInCount = groupParticipants.filter((p) => p.checked_in).length;
              const verified = verifiedMap[registration.id] ?? false;
              return (
                <tr key={registration.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <input
                      type="checkbox"
                      checked={verified}
                      disabled={pendingIds[registration.id]}
                      onChange={(e) => toggleVerified(registration.id, e.target.checked)}
                      className="h-5 w-5 cursor-pointer accent-lime-dark disabled:opacity-50"
                      aria-label="Payment verified"
                    />
                  </td>
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

      {rows.length > 0 && sortedRows.length === 0 && (
        <p className="mt-6 text-sm text-navy/60">No participants match &quot;{search}&quot;.</p>
      )}
      {rows.length === 0 && <p className="mt-6 text-sm text-navy/60">No registrations yet.</p>}
    </>
  );
}
