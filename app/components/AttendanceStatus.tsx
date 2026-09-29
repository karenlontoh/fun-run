"use client";

import { useState } from "react";

type AttendanceStatusProps = {
  participantId: string;
  initialAttended: boolean;
  initialAttendedAt: string | null;
};

export function AttendanceStatus({
  participantId,
  initialAttended,
  initialAttendedAt,
}: AttendanceStatusProps) {
  const [attended, setAttended] = useState(initialAttended);
  const [attendedAt, setAttendedAt] = useState(initialAttendedAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/participants/${participantId}/attend`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update. Try again.");
        return;
      }
      setAttended(true);
      setAttendedAt(data.attended_at ?? new Date().toISOString());
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (attended) {
    return (
      <div className="text-sm font-semibold text-lime-dark">
        ✓ Attended race day
        {attendedAt && (
          <span className="ml-1 font-normal text-navy/40">
            ({new Date(attendedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })})
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
        className="rounded-full border border-navy/20 px-4 py-2 text-sm font-semibold text-navy transition hover:bg-navy/5 disabled:opacity-60"
      >
        {loading ? "Updating..." : "Mark Attended (manual)"}
      </button>
      {error && <p className="mt-1 text-xs font-semibold text-orange-dark">{error}</p>}
    </div>
  );
}
