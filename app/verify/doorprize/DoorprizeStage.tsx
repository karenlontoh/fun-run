"use client";

import { useState } from "react";
import type { Participant } from "@/lib/types";

const GENDER_LABEL: Record<string, string> = { L: "Male", P: "Female" };

export function DoorprizeStage({ initialEligibleCount }: { initialEligibleCount: number }) {
  const [remaining, setRemaining] = useState(initialEligibleCount);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [winner, setWinner] = useState<Participant | null>(null);

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
      setWinner(data.winner as Participant);
      setRemaining((prev) => Math.max(0, prev - 1));
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPicking(false);
    }
  }

  return (
    <div className="mt-10 flex flex-col items-center text-center">
      <div className="flex w-full min-h-[360px] items-center justify-center rounded-3xl border border-navy/10 bg-white p-10">
        {winner ? (
          <div>
            <p className="font-display text-base tracking-[0.3em] text-orange">WINNER</p>
            <p className="font-display mt-4 text-5xl text-navy sm:text-6xl">{winner.full_name}</p>
            <p className="mt-4 text-xl text-navy/70">
              BIB {winner.bib_number} · {winner.category} · {GENDER_LABEL[winner.gender] ?? winner.gender}
            </p>
          </div>
        ) : (
          <p className="text-lg text-navy/40">Press the button to pick a winner.</p>
        )}
      </div>

      <button
        type="button"
        onClick={pickWinner}
        disabled={picking || remaining === 0}
        className="font-display mt-8 rounded-full bg-orange px-10 py-4 text-xl tracking-wide text-cream shadow-lg transition hover:bg-orange-dark disabled:opacity-60"
      >
        {picking ? "PICKING..." : "🎉 PICK A WINNER"}
      </button>

      <p className="mt-4 text-sm text-navy/50">
        {remaining} checked-in participant{remaining === 1 ? "" : "s"} still eligible.
      </p>
      {error && <p className="mt-2 text-sm font-semibold text-orange-dark">{error}</p>}
    </div>
  );
}
