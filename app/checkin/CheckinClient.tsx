"use client";

import { useState } from "react";

type Participant = {
  id: string;
  bib_number: number;
  full_name: string;
  category: string;
  gender: "L" | "P";
  attended: boolean;
  attended_at: string | null;
};

type Stage = "form" | "loading" | "found" | "confirmed" | "not_found" | "error";

export function CheckinClient() {
  const [bib, setBib] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = bib.trim();
    if (!trimmed) return;

    setStage("loading");
    try {
      const res = await fetch(`/api/public/checkin/${trimmed}`);
      if (!res.ok) {
        setStage("not_found");
        return;
      }
      const data = await res.json();
      setParticipant(data.participant);
      setStage(data.participant.attended ? "confirmed" : "found");
    } catch {
      setStage("error");
    }
  }

  async function handleConfirm() {
    if (!participant) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/public/checkin/${participant.bib_number}`, { method: "POST" });
      if (!res.ok) {
        setStage("error");
        return;
      }
      const data = await res.json();
      setParticipant((prev) => (prev ? { ...prev, attended: true, attended_at: data.attended_at } : prev));
      setStage("confirmed");
    } catch {
      setStage("error");
    } finally {
      setConfirming(false);
    }
  }

  function reset() {
    setBib("");
    setParticipant(null);
    setStage("form");
  }

  return (
    <div className="mx-auto max-w-sm">
      {(stage === "form" || stage === "loading") && (
        <form onSubmit={handleLookup} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-navy">Your BIB Number</span>
            <input
              type="number"
              inputMode="numeric"
              required
              value={bib}
              onChange={(e) => setBib(e.target.value)}
              placeholder="e.g. 1024"
              className="mt-1 w-full rounded-xl border border-navy/20 px-4 py-3 text-center font-display text-2xl focus:border-orange focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={stage === "loading"}
            className="w-full rounded-full bg-orange px-4 py-3 font-display text-lg tracking-wide text-cream transition hover:bg-orange-dark disabled:opacity-60"
          >
            {stage === "loading" ? "LOOKING UP..." : "FIND MY BIB"}
          </button>
        </form>
      )}

      {stage === "not_found" && (
        <div className="rounded-2xl border border-orange/40 bg-orange/10 px-5 py-4 text-center text-sm text-orange-dark">
          BIB number not found. Please double-check the number.
          <button type="button" onClick={reset} className="mt-3 block w-full font-semibold underline">
            Try Again
          </button>
        </div>
      )}

      {stage === "error" && (
        <div className="rounded-2xl border border-orange/40 bg-orange/10 px-5 py-4 text-center text-sm text-orange-dark">
          Something went wrong. Please try again.
          <button type="button" onClick={reset} className="mt-3 block w-full font-semibold underline">
            Try Again
          </button>
        </div>
      )}

      {(stage === "found" || stage === "confirmed") && participant && (
        <div className="rounded-2xl border border-navy/10 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">BIB</p>
          <p className="font-display text-6xl text-orange">{participant.bib_number}</p>
          <p className="font-display mt-4 text-2xl text-navy">{participant.full_name}</p>
          <p className="mt-1 text-sm text-navy/60">
            {participant.category} · {participant.gender === "L" ? "Male" : "Female"}
          </p>

          <div className="mt-6">
            {stage === "confirmed" ? (
              <p className="rounded-full bg-lime/20 px-4 py-2.5 text-sm font-semibold text-lime-dark">
                ✓ You&apos;re checked in — see you at the start line!
              </p>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full rounded-full bg-navy px-4 py-3 font-display text-lg tracking-wide text-cream transition hover:bg-navy-light disabled:opacity-60"
              >
                {confirming ? "CHECKING IN..." : "CHECK IN"}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-4 text-sm font-semibold text-navy/50 hover:text-orange"
          >
            Not you? Try another BIB
          </button>
        </div>
      )}
    </div>
  );
}
