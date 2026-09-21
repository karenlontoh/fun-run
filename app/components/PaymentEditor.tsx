"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatIDR } from "@/lib/pricing";
import { PAYMENT_METHODS, PAYMENT_STATUSES, type PaymentMethod, type PaymentStatus } from "@/lib/types";

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Need Verify",
  verified: "Verified",
  unverified: "Unverified",
};

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  pending: "border-amber-200 bg-amber-100 text-amber-700",
  verified: "border-green-200 bg-green-100 text-green-700",
  unverified: "border-red-200 bg-red-100 text-red-700",
};

type Props = {
  registrationId: string;
  totalAmount: number;
  initialStatus: PaymentStatus;
  initialMethod: PaymentMethod;
  proofUrl: string | null;
};

export function PaymentEditor({ registrationId, totalAmount, initialStatus, initialMethod, proofUrl }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState({ status: initialStatus, method: initialMethod });
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>(current.status);
  const [method, setMethod] = useState<PaymentMethod>(current.method);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setStatus(current.status);
    setMethod(current.method);
    setFile(null);
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("status", status);
      formData.set("payment_method", method);
      if (file) formData.set("payment_proof", file);

      const res = await fetch(`/api/registrations/${registrationId}/payment`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Failed to save. Try again.");
        return;
      }
      setCurrent({ status, method });
      setEditing(false);
      if (file) router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="mt-4 rounded-xl border border-orange/40 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-navy">Total Payment</p>
          <p className="font-display text-xl text-orange">{formatIDR(totalAmount)}</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-navy/60">Payment Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus)}
              className="mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy/60">Payment Method</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm capitalize focus:border-orange focus:outline-none"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m} className="capitalize">
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-navy/60">
              {proofUrl ? "Replace Payment Proof (optional)" : "Upload Payment Proof (optional)"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full rounded-lg border border-navy/20 px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-orange file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-cream"
            />
          </label>
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-orange-dark">{error}</p>}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-cream transition hover:bg-orange-dark disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-semibold text-navy transition hover:bg-navy/5"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-navy/10 bg-white px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-navy">Total Payment</p>
        <p className="font-display text-xl text-orange">{formatIDR(totalAmount)}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[current.status]}`}>
          {STATUS_LABEL[current.status]}
        </span>
        <span className="text-xs capitalize text-navy/60">{current.method}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {proofUrl ? (
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-navy underline decoration-lime decoration-2 underline-offset-4"
          >
            View Payment Proof
          </a>
        ) : (
          <p className="text-sm text-navy/60">Payment proof not available.</p>
        )}
        <button type="button" onClick={startEditing} className="text-sm font-semibold text-navy/50 hover:text-orange">
          Edit
        </button>
      </div>
    </div>
  );
}
