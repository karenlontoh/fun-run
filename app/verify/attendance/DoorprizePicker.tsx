"use client";

import { useState } from "react";
import type { Participant } from "@/lib/types";

const GENDER_LABEL: Record<string, string> = { L: "Male", P: "Female" };

export function DoorprizePicker({
  initialWinners,
  initialEligibleCount,
}: {
  initialWinners: Participant[];
  initialEligibleCount: number;
}) {
  const [winners, setWinners] = useState(initialWinners);
  const [remaining, setRemaining] = useState(initialEligibleCount);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastWinner, setLastWinner] = useState<Participant | null>(null);

  async function pickWinner() {
    setPicking(true);
    setError(null);
    try {
      const res = await fetch("/api/participants/doorprize", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Failed to pick a winner. Try again.");
        return;
      }
      const winner: Participant = data.winner;
      setWinners((prev) => [winner, ...prev]);
      setRemaining((prev) => Math.max(0, prev - 1));
      setLastWinner(winner);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPicking(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-navy">Doorprize</h2>
          <p className="mt-1 text-sm text-navy/60">
            Randomly picks one checked-in participant who hasn&apos;t won yet — {remaining} eligible.
          </p>
        </div>
        <button
          type="button"
          onClick={pickWinner}
          disabled={picking || remaining === 0}
          className="rounded-full bg-orange px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-orange-dark disabled:opacity-60"
        >
          {picking ? "Picking..." : "🎉 Pick a Winner"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-orange-dark">{error}</p>}
      {remaining === 0 && !error && (
        <p className="mt-3 text-sm font-semibold text-navy/60">
          Everyone who&apos;s checked in has already won.
        </p>
      )}

      {lastWinner && (
        <div className="mt-4 rounded-xl bg-lime px-6 py-5 text-navy">
          <p className="font-display text-sm tracking-[0.2em]">WINNER</p>
          <p className="font-display mt-1 text-3xl">{lastWinner.full_name}</p>
          <p className="mt-1 text-sm">
            BIB {lastWinner.bib_number} · {lastWinner.category} ·{" "}
            {GENDER_LABEL[lastWinner.gender] ?? lastWinner.gender}
          </p>
        </div>
      )}

      {winners.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
            Winners ({winners.length})
          </p>
          <ul className="mt-2 divide-y divide-navy/10 rounded-xl border border-navy/10">
            {winners.map((w) => (
              <li key={w.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="font-semibold text-navy">
                  {w.full_name} <span className="font-normal text-navy/50">— BIB {w.bib_number}</span>
                </span>
                <span className="text-navy/50">
                  {w.doorprize_won_at
                    ? new Date(w.doorprize_won_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
