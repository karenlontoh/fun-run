"use client";

import { useState } from "react";

type CollectRacePackButtonProps = {
  participantId: string;
  initialCheckedIn: boolean;
  initialCheckedInAt: string | null;
};

export function CollectRacePackButton({
  participantId,
  initialCheckedIn,
  initialCheckedInAt,
}: CollectRacePackButtonProps) {
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [checkedInAt, setCheckedInAt] = useState(initialCheckedInAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/participants/${participantId}/checkin`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update. Try again.");
        return;
      }
      setCheckedIn(true);
      setCheckedInAt(data.checked_in_at ?? new Date().toISOString());
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkedIn) {
    return (
      <div className="text-sm font-semibold text-lime-dark">
        ✓ Race pack collected
        {checkedInAt && (
          <span className="ml-1 font-normal text-navy/40">
            ({new Date(checkedInAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })})
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-cream transition hover:bg-orange-dark disabled:opacity-60"
      >
        {loading ? "Updating..." : "Collect Race Pack"}
      </button>
      {error && <p className="mt-1 text-xs font-semibold text-orange-dark">{error}</p>}
    </div>
  );
}
