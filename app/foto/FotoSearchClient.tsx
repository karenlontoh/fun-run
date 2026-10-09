"use client";

import { useEffect, useState } from "react";

type Photo = { id: string; url: string };
type Stage = "loading" | "ready" | "error";

export function FotoSearchClient() {
  const [bibInput, setBibInput] = useState("");
  const [activeBib, setActiveBib] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [stage, setStage] = useState<Stage>("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStage("loading");
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (activeBib) params.set("bib", activeBib);

        const res = await fetch(`/api/race-photos?${params.toString()}`);
        if (!res.ok) {
          if (!cancelled) setStage("error");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setPhotos(data.photos ?? []);
        setTotal(data.total ?? 0);
        setPageSize(data.pageSize ?? 50);
        setStage("ready");
      } catch {
        if (!cancelled) setStage("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeBib, page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = bibInput.trim();
    setActiveBib(trimmed || null);
    setPage(1);
  }

  function clearSearch() {
    setBibInput("");
    setActiveBib(null);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <form onSubmit={handleSearch} className="mx-auto flex max-w-sm gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={bibInput}
          onChange={(e) => setBibInput(e.target.value)}
          placeholder="Search by BIB number (optional)"
          className="w-full rounded-xl border border-navy/20 px-4 py-2.5 text-center focus:border-orange focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-orange px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-orange-dark"
        >
          Search
        </button>
      </form>

      <div className="mx-auto mt-3 max-w-sm text-center">
        {activeBib ? (
          <p className="text-sm text-navy/60">
            Showing photos for BIB {activeBib} —{" "}
            <button type="button" onClick={clearSearch} className="font-semibold text-orange hover:underline">
              show all photos
            </button>
          </p>
        ) : (
          <p className="text-sm text-navy/60">Showing all photos.</p>
        )}
      </div>

      {stage === "error" && (
        <p className="mt-8 text-center text-sm font-semibold text-orange-dark">
          Something went wrong loading photos. Please try again.
        </p>
      )}

      {stage !== "error" && (
        <>
          <p className="mt-6 text-center text-sm text-navy/60">
            {stage === "loading" ? "Loading..." : `${total} photo${total === 1 ? "" : "s"} found.`}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border border-navy/10 bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-56 w-full object-cover" loading="lazy" />
              </a>
            ))}
          </div>

          {stage === "ready" && photos.length === 0 && (
            <p className="mt-6 text-center text-sm text-navy/60">
              {activeBib
                ? "No photos found for that BIB number yet. Photos are added gradually after the event — check back later."
                : "No photos uploaded yet."}
            </p>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4 text-sm">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-full border border-navy/20 px-4 py-1.5 font-semibold text-navy transition hover:bg-navy/5 disabled:opacity-40"
              >
                ← Prev
              </button>
              <p className="font-semibold text-navy">
                Page {page} / {totalPages}
              </p>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-full border border-navy/20 px-4 py-1.5 font-semibold text-navy transition hover:bg-navy/5 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
