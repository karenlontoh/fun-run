"use client";

import { useState } from "react";

type Photo = { id: string; url: string };
type Stage = "form" | "loading" | "results" | "not_found" | "error";

export function FotoSearchClient() {
  const [bib, setBib] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [photos, setPhotos] = useState<Photo[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = bib.trim();
    if (!trimmed) return;

    setStage("loading");
    try {
      const res = await fetch(`/api/race-photos?bib=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        setStage("error");
        return;
      }
      const data = await res.json();
      const found = (data.photos ?? []) as Photo[];
      setPhotos(found);
      setStage(found.length > 0 ? "results" : "not_found");
    } catch {
      setStage("error");
    }
  }

  function reset() {
    setBib("");
    setPhotos([]);
    setStage("form");
  }

  if (stage === "results") {
    return (
      <div>
        <div className="mx-auto max-w-sm text-center">
          <button type="button" onClick={reset} className="text-sm font-semibold text-navy/50 hover:text-orange">
            ← Search another BIB
          </button>
          <p className="mt-2 text-sm text-navy/60">
            {photos.length} photo{photos.length === 1 ? "" : "s"} found.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl border border-navy/10 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-56 w-full object-cover" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <form onSubmit={handleSearch} className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-navy">Your BIB Number</span>
          <input
            type="number"
            inputMode="numeric"
            required
            value={bib}
            onChange={(e) => setBib(e.target.value)}
            placeholder="e.g. 5024"
            className="mt-1 w-full rounded-xl border border-navy/20 px-4 py-3 text-center font-display text-2xl focus:border-orange focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={stage === "loading"}
          className="w-full rounded-full bg-orange px-4 py-3 font-display text-lg tracking-wide text-cream transition hover:bg-orange-dark disabled:opacity-60"
        >
          {stage === "loading" ? "SEARCHING..." : "FIND MY PHOTOS"}
        </button>
      </form>

      {stage === "not_found" && (
        <div className="mt-6 rounded-2xl border border-orange/40 bg-orange/10 px-5 py-4 text-center text-sm text-orange-dark">
          No photos found for that BIB number yet. Photos are added gradually after the event —
          check back later.
          <button type="button" onClick={reset} className="mt-3 block w-full font-semibold underline">
            Try Another BIB
          </button>
        </div>
      )}

      {stage === "error" && (
        <div className="mt-6 rounded-2xl border border-orange/40 bg-orange/10 px-5 py-4 text-center text-sm text-orange-dark">
          Something went wrong. Please try again.
          <button type="button" onClick={reset} className="mt-3 block w-full font-semibold underline">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
