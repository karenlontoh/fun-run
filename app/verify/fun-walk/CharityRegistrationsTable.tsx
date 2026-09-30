"use client";

import { useMemo, useState } from "react";
import { formatIDR } from "@/lib/pricing";
import { PAYMENT_STATUSES, type CharityParticipant, type CharityRegistration, type PaymentStatus } from "@/lib/types";

type Row = {
  registration: CharityRegistration;
  participants: CharityParticipant[];
  proofUrl: string | null;
};

const PAGE_SIZE = 20;

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

export function CharityRegistrationsTable({ rows: initialRows }: { rows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [statusMap, setStatusMap] = useState<Record<string, PaymentStatus>>(() =>
    Object.fromEntries(initialRows.map((r) => [r.registration.id, r.registration.payment_status]))
  );
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [errorIds, setErrorIds] = useState<Record<string, string>>({});
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [lastSearch, setLastSearch] = useState(search);

  async function handleDelete(id: string, contactName: string) {
    if (!window.confirm(`Delete the charity walk registration for "${contactName}"? This cannot be undone.`)) {
      return;
    }
    setDeletingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/charity/registrations/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorIds((prev) => ({ ...prev, [id]: data?.error ?? "Failed to delete. Try again." }));
        return;
      }
      setRows((prev) => prev.filter((r) => r.registration.id !== id));
    } catch {
      setErrorIds((prev) => ({ ...prev, [id]: "Network error. Try again." }));
    } finally {
      setDeletingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  async function updateStatus(id: string, next: PaymentStatus) {
    const previous = statusMap[id];
    setStatusMap((prev) => ({ ...prev, [id]: next }));
    setPendingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/charity/registrations/${id}/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatusMap((prev) => ({ ...prev, [id]: previous }));
        setErrorIds((prev) => ({ ...prev, [id]: data?.error ?? "Failed to update. Try again." }));
      }
    } catch {
      setStatusMap((prev) => ({ ...prev, [id]: previous }));
      setErrorIds((prev) => ({ ...prev, [id]: "Network error. Try again." }));
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
    return rows.filter(
      ({ registration, participants }) =>
        registration.id.toLowerCase().includes(query) ||
        participants.some((p) => p.full_name.toLowerCase().includes(query))
    );
  }, [rows, search]);

  let effectivePage = page;
  if (lastSearch !== search) {
    setLastSearch(search);
    setPage(1);
    effectivePage = 1;
  }

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(effectivePage, totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <div className="mt-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by participant name or registration ID..."
          className="w-full max-w-sm rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm text-navy placeholder:text-navy/40 focus:border-orange focus:outline-none"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-navy/10 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-navy/10 bg-navy/5 text-xs uppercase tracking-wide text-navy/60">
            <tr>
              <th className="px-4 py-3">Payment Status</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Participants</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment Proof</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {pagedRows.map(({ registration, participants, proofUrl }) => {
              const status = statusMap[registration.id] ?? "pending";
              return (
                <tr key={registration.id}>
                  <td className="px-4 py-3">
                    <select
                      value={status}
                      disabled={pendingIds[registration.id]}
                      onChange={(e) => updateStatus(registration.id, e.target.value as PaymentStatus)}
                      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${STATUS_CLASSES[status]}`}
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    {errorIds[registration.id] && (
                      <p className="mt-1 max-w-[160px] whitespace-normal text-xs font-semibold text-orange-dark">
                        {errorIds[registration.id]}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-navy/60 capitalize">
                    {registration.payment_method ?? <span className="text-navy/30">—</span>}
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
                    {participants.map((p) => p.full_name).join(", ") || "—"}
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
                    <button
                      type="button"
                      onClick={() => handleDelete(registration.id, registration.contact_name)}
                      disabled={deletingIds[registration.id]}
                      className="font-semibold text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingIds[registration.id] ? "Deleting..." : "Delete"}
                    </button>
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
      {rows.length === 0 && <p className="mt-6 text-sm text-navy/60">No charity walk registrations yet.</p>}

      {filteredRows.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-navy/60">
          <p>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRows.length)} of{" "}
            {filteredRows.length}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-full border border-navy/20 px-4 py-1.5 font-semibold text-navy transition hover:bg-navy/5 disabled:opacity-40"
            >
              ← Prev
            </button>
            <p className="font-semibold text-navy">
              Page {currentPage} / {totalPages}
            </p>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-full border border-navy/20 px-4 py-1.5 font-semibold text-navy transition hover:bg-navy/5 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
