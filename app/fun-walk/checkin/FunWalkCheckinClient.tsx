"use client";

import { useEffect, useState } from "react";

type SearchResult = {
  id: string;
  full_name: string;
  gender: "L" | "P";
  institution: string;
  attended: boolean;
  attended_at: string | null;
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export function FunWalkCheckinClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only ever fetches matches for what's actually typed — the full
  // participant roster is never sent to the client. Each effect invocation
  // owns its own timeout + AbortController (not a shared ref), so the
  // cleanup for a superseded keystroke always cancels both the pending
  // timer and any in-flight fetch before the next one starts — otherwise
  // an older, slower request can resolve after a newer one and overwrite
  // its correct results. State updates happen inside the timeout callback,
  // not synchronously in the effect body, since this project's lint config
  // flags direct setState calls in an effect.
  useEffect(() => {
    const trimmed = query.trim();
    const controller = new AbortController();

    const timeout = setTimeout(
      async () => {
        if (trimmed.length < MIN_QUERY_LENGTH) {
          setResults([]);
          setSearching(false);
          return;
        }
        setSearching(true);
        try {
          const res = await fetch(`/api/public/charity-checkin/search?q=${encodeURIComponent(trimmed)}`, {
            signal: controller.signal,
          });
          const data = await res.json().catch(() => null);
          setResults(data?.participants ?? []);
        } catch (err) {
          if (!(err instanceof DOMException && err.name === "AbortError")) setResults([]);
        } finally {
          setSearching(false);
        }
      },
      trimmed.length < MIN_QUERY_LENGTH ? 0 : DEBOUNCE_MS
    );

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  async function handleConfirm() {
    if (!selected) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/charity-checkin/${selected.id}`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Gagal check in. Coba lagi.");
        return;
      }
      setSelected((prev) => (prev ? { ...prev, attended: true, attended_at: data.attended_at } : prev));
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setConfirming(false);
    }
  }

  function reset() {
    setQuery("");
    setResults([]);
    setSelected(null);
    setError(null);
  }

  if (selected) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white px-6 py-8 text-center shadow-sm">
        <p className="font-display text-2xl text-navy">{selected.full_name}</p>
        <p className="mt-1 text-sm text-navy/60">
          {selected.institution || "—"} · {selected.gender === "L" ? "Laki-laki" : "Perempuan"}
        </p>

        <div className="mt-6">
          {selected.attended ? (
            <p className="rounded-full bg-lime/20 px-4 py-2.5 text-sm font-semibold text-lime-dark">
              ✓ Kamu sudah check in — sampai jumpa!
            </p>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full rounded-full bg-navy px-4 py-3 font-display text-lg tracking-wide text-cream transition hover:bg-navy-light disabled:opacity-60"
            >
              {confirming ? "MEMPROSES..." : "CHECK IN"}
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-orange-dark">{error}</p>}

        <button type="button" onClick={reset} className="mt-4 text-sm font-semibold text-navy/50 hover:text-orange">
          Bukan kamu? Cari lagi
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ketik namamu..."
        autoFocus
        className="w-full rounded-xl border border-navy/20 px-4 py-3 text-center text-lg focus:border-orange focus:outline-none"
      />

      {query.trim().length >= MIN_QUERY_LENGTH && (
        <div className="mt-3 overflow-hidden rounded-xl border border-navy/10 bg-white">
          {searching ? (
            <p className="px-4 py-3 text-sm text-navy/50">Mencari...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-navy/50">
              Tidak ada nama yang cocok. Coba cek ejaannya.
            </p>
          ) : (
            <ul className="divide-y divide-navy/10">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-cream"
                  >
                    <span>
                      <span className="block font-semibold text-navy">{p.full_name}</span>
                      <span className="block text-xs text-navy/50">{p.institution || "—"}</span>
                    </span>
                    {p.attended && (
                      <span className="text-xs font-semibold text-lime-dark">✓ Sudah check in</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
