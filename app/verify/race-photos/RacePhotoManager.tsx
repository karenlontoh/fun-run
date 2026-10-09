"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RacePhoto } from "@/lib/types";

type Row = { photo: RacePhoto; url: string };

// Matches the server's own concurrency (see UPLOAD_CONCURRENCY in
// app/api/race-photos/route.ts) — sending the whole selection in one
// request left the admin staring at a single spinner for minutes with no
// sense of progress, so the client splits it into batches itself instead
// and reports progress between each one.
const CLIENT_BATCH_SIZE = 5;

// Real camera photos run 10-11MB each — 5 of those in one multipart request
// blows past Vercel's ~4.5MB request body limit (confirmed in production:
// a request with just 2 original photos came back 413
// FUNCTION_PAYLOAD_TOO_LARGE). Downscaling in the browser first keeps a
// batch of 5 comfortably under that.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.78;

async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file); // respects EXIF orientation
  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) return file;

  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}

export function RacePhotoManager({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  // initialRows is a prop, not state — useState only reads it on first
  // mount, so after router.refresh() gives the server component fresh data
  // (e.g. post-upload), this component would otherwise keep showing the
  // stale list it mounted with even though the stat cards above it (which
  // read the server component's data directly) update correctly. Resetting
  // state during render (React's documented pattern for this, see
  // https://react.dev/learn/you-might-not-need-an-effect) instead of in a
  // useEffect avoids an extra render pass.
  const [prevInitialRows, setPrevInitialRows] = useState(initialRows);
  if (initialRows !== prevInitialRows) {
    setPrevInitialRows(initialRows);
    setRows(initialRows);
  }
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [onlyUntagged, setOnlyUntagged] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;

    const allFiles = Array.from(files);
    setUploading(true);
    setUploadError(null);
    setUploadSummary(null);
    setProgress({ done: 0, total: allFiles.length });

    let uploadedCount = 0;
    let taggedCount = 0;

    try {
      for (let i = 0; i < allFiles.length; i += CLIENT_BATCH_SIZE) {
        const batch = allFiles.slice(i, i + CLIENT_BATCH_SIZE);
        const compressed = await Promise.all(
          batch.map((f) => compressImage(f).catch(() => f))
        );
        const formData = new FormData();
        compressed.forEach((f) => formData.append("photos", f));

        const res = await fetch("/api/race-photos", { method: "POST", body: formData });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setUploadError(data?.error ?? "Upload failed partway through. Already-uploaded photos were kept.");
          break;
        }
        const uploaded = (data?.uploaded ?? []) as { bib_numbers: number[] }[];
        uploadedCount += uploaded.length;
        taggedCount += uploaded.filter((u) => u.bib_numbers.length > 0).length;
        setProgress({ done: Math.min(i + batch.length, allFiles.length), total: allFiles.length });
      }

      if (uploadedCount > 0) {
        setUploadSummary(
          `${uploadedCount} photo(s) uploaded — ${taggedCount} auto-tagged, ${uploadedCount - taggedCount} need review.`
        );
      }
      setFiles(null);
      router.refresh();
    } catch {
      setUploadError("Network error partway through. Already-uploaded photos were kept.");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  function startEditing(row: Row) {
    setEditingId(row.photo.id);
    setEditValue(row.photo.bib_numbers.join(", "));
  }

  async function saveTags(id: string) {
    const bibNumbers = editValue
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number);

    if (bibNumbers.some((n) => !Number.isInteger(n) || n <= 0)) {
      setRowErrors((prev) => ({ ...prev, [id]: "Use comma-separated numbers only." }));
      return;
    }

    setSavingId(id);
    setRowErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch(`/api/race-photos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bib_numbers: bibNumbers }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setRowErrors((prev) => ({ ...prev, [id]: data?.error ?? "Failed to save." }));
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.photo.id === id ? { ...r, photo: { ...r.photo, bib_numbers: bibNumbers } } : r))
      );
      setEditingId(null);
    } catch {
      setRowErrors((prev) => ({ ...prev, [id]: "Network error." }));
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this photo? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/race-photos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setRowErrors((prev) => ({ ...prev, [id]: data?.error ?? "Failed to delete." }));
        return;
      }
      setRows((prev) => prev.filter((r) => r.photo.id !== id));
    } catch {
      setRowErrors((prev) => ({ ...prev, [id]: "Network error." }));
    } finally {
      setDeletingId(null);
    }
  }

  const visibleRows = onlyUntagged ? rows.filter((r) => r.photo.bib_numbers.length === 0) : rows;

  return (
    <>
      <form onSubmit={handleUpload} className="mt-8 rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="font-display text-xl text-navy">Upload Photos</h2>
        <p className="mt-1 text-sm text-navy/60">
          Up to 20 at a time. Each one gets watermarked and auto-scanned for BIB numbers.
        </p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className="mt-4 block w-full rounded-lg border border-navy/20 bg-white px-4 py-2.5 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-orange file:px-4 file:py-2 file:font-semibold file:text-cream"
        />
        {uploadError && <p className="mt-3 text-sm font-semibold text-orange-dark">{uploadError}</p>}
        {uploadSummary && <p className="mt-3 text-sm font-semibold text-lime-dark">{uploadSummary}</p>}
        {progress && (
          <div className="mt-3">
            <p className="text-sm font-semibold text-navy">
              Processing {progress.done} / {progress.total} photos...
            </p>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-navy/10">
              <div
                className="h-full rounded-full bg-orange transition-all duration-300"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={uploading || !files || files.length === 0}
          className="mt-4 rounded-full bg-orange px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-orange-dark disabled:opacity-60"
        >
          {uploading ? "Uploading & scanning..." : "Upload & Detect"}
        </button>
      </form>

      <div className="mt-8 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-navy">
          <input
            type="checkbox"
            checked={onlyUntagged}
            onChange={(e) => setOnlyUntagged(e.target.checked)}
          />
          Only show photos needing review
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleRows.map((row) => (
          <div key={row.photo.id} className="overflow-hidden rounded-xl border border-navy/10 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.url} alt="" className="h-48 w-full object-cover" />
            <div className="p-4">
              {editingId === row.photo.id ? (
                <div>
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="e.g. 5008, 2034"
                    className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveTags(row.photo.id)}
                      disabled={savingId === row.photo.id}
                      className="rounded-full bg-orange px-4 py-1.5 text-xs font-semibold text-cream transition hover:bg-orange-dark disabled:opacity-60"
                    >
                      {savingId === row.photo.id ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full border border-navy/20 px-4 py-1.5 text-xs font-semibold text-navy transition hover:bg-navy/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    {row.photo.bib_numbers.length > 0 ? (
                      <p className="text-sm font-semibold text-navy">
                        BIB {row.photo.bib_numbers.join(", ")}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-orange-dark">Needs review</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditing(row)}
                    className="text-xs font-semibold text-navy/50 hover:text-orange"
                  >
                    Edit
                  </button>
                </div>
              )}
              {rowErrors[row.photo.id] && (
                <p className="mt-1 text-xs font-semibold text-orange-dark">{rowErrors[row.photo.id]}</p>
              )}
              <button
                type="button"
                onClick={() => handleDelete(row.photo.id)}
                disabled={deletingId === row.photo.id}
                className="mt-2 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
              >
                {deletingId === row.photo.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {visibleRows.length === 0 && (
        <p className="mt-6 text-sm text-navy/60">
          {onlyUntagged ? "Nothing needs review right now." : "No photos uploaded yet."}
        </p>
      )}
    </>
  );
}
