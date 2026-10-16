"use client";

import { useMemo, useState } from "react";
import type { Participant } from "@/lib/types";

type SortOption = "earliest" | "latest" | "name" | "bib";

const PAGE_SIZE = 50;

const GENDER_LABEL: Record<string, string> = { L: "Male", P: "Female" };

export function AttendanceTable({ rows }: { rows: Participant[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("earliest");
  const [page, setPage] = useState(1);
  const [lastFilters, setLastFilters] = useState({ search, sortBy });

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (p) => p.full_name.toLowerCase().includes(query) || String(p.bib_number).includes(query)
    );
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "earliest":
          return (a.attended_at ?? "").localeCompare(b.attended_at ?? "");
        case "latest":
          return (b.attended_at ?? "").localeCompare(a.attended_at ?? "");
        case "name":
          return a.full_name.localeCompare(b.full_name);
        case "bib":
          return a.bib_number - b.bib_number;
      }
    });
    return sorted;
  }, [filteredRows, sortBy]);

  let effectivePage = page;
  if (lastFilters.search !== search || lastFilters.sortBy !== sortBy) {
    setLastFilters({ search, sortBy });
    setPage(1);
    effectivePage = 1;
  }

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const currentPage = Math.min(effectivePage, totalPages);
  const pagedRows = sortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or BIB number..."
          className="w-full max-w-sm rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm text-navy placeholder:text-navy/40 focus:border-orange focus:outline-none"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm text-navy focus:border-orange focus:outline-none"
        >
          <option value="earliest">Sort: Earliest Check-In First</option>
          <option value="latest">Sort: Latest Check-In First</option>
          <option value="name">Sort: Name (A-Z)</option>
          <option value="bib">Sort: BIB Number</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-navy/10 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-navy/10 bg-navy/5 text-xs uppercase tracking-wide text-navy/60">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">BIB</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Checked In At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {pagedRows.map((p, i) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-navy/50">
                  {sortBy === "earliest" ? (currentPage - 1) * PAGE_SIZE + i + 1 : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-display text-orange">{p.bib_number}</td>
                <td className="px-4 py-3 font-semibold text-navy">{p.full_name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-navy/70">{p.category}</td>
                <td className="whitespace-nowrap px-4 py-3 text-navy/70">
                  {GENDER_LABEL[p.gender] ?? p.gender}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-navy/70">
                  {p.attended_at
                    ? new Date(p.attended_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && sortedRows.length === 0 && (
        <p className="mt-6 text-sm text-navy/60">No participants match &quot;{search}&quot;.</p>
      )}
      {rows.length === 0 && <p className="mt-6 text-sm text-navy/60">Nobody has checked in yet.</p>}

      {sortedRows.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-navy/60">
          <p>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedRows.length)} of{" "}
            {sortedRows.length}
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
