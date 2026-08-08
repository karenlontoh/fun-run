"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, JERSEY_SIZES, type Category, type Gender, type JerseySize } from "@/lib/types";
import { calculateTransferAmount, formatIDR, getCategoryPrice } from "@/lib/pricing";
import { PAYMENT } from "@/lib/event-config";

type ParticipantForm = {
  full_name: string;
  gender: Gender;
  category: Category;
  jersey_size: JerseySize;
};

function emptyParticipant(): ParticipantForm {
  return { full_name: "", gender: "L", category: CATEGORIES[0], jersey_size: "M" };
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function RegisterForm() {
  const router = useRouter();
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [participants, setParticipants] = useState<ParticipantForm[]>([emptyParticipant()]);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const transferAmount = useMemo(
    () => calculateTransferAmount(participants.map((p) => p.category)),
    [participants]
  );

  function updateParticipant(index: number, patch: Partial<ParticipantForm>) {
    setParticipants((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function addParticipant() {
    setParticipants((prev) => [...prev, emptyParticipant()]);
  }

  function removeParticipant(index: number) {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCopyAccountNumber() {
    try {
      await navigator.clipboard.writeText(PAYMENT.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context) — nothing to fall back to.
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_FILE_SIZE) {
      setError("Payment proof file must be under 5MB.");
      e.target.value = "";
      setPaymentProof(null);
      return;
    }
    setError(null);
    setPaymentProof(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!paymentProof) {
      setError("Payment proof is required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("contact_name", contactName);
      formData.set("contact_email", contactEmail);
      formData.set("contact_phone", contactPhone);
      formData.set("participants", JSON.stringify(participants));
      formData.set("payment_proof", paymentProof);

      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/daftar/berhasil/${data.id}`);
    } catch {
      setError("Couldn't connect to the server. Please check your internet connection.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section>
        <h2 className="font-display text-2xl text-navy">Contact Details</h2>
        <p className="mt-1 text-sm text-navy/60">Main contact for this group registration.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-navy">Full Name</span>
            <input
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
              placeholder="Your name"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-navy">Phone / WhatsApp Number</span>
            <input
              required
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
              placeholder="08xxxxxxxxxx"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-navy">Email</span>
            <input
              required
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
              placeholder="name@email.com"
            />
          </label>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-navy">Participant Details</h2>
            {/* <p className="mt-1 text-sm text-navy/60">
              Add every participant in this group. Each participant receives their own BIB number.
            </p> */}
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {participants.map((p, i) => (
            <div key={i} className="relative rounded-2xl border border-navy/15 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg text-orange">PARTICIPANT {i + 1}</p>
                {participants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeParticipant(i)}
                    className="text-sm font-semibold text-navy/50 hover:text-orange"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-navy">Full Name</span>
                  <input
                    required
                    value={p.full_name}
                    onChange={(e) => updateParticipant(i, { full_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
                    placeholder="Participant's name"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-navy">Gender</span>
                  <select
                    value={p.gender}
                    onChange={(e) => updateParticipant(i, { gender: e.target.value as Gender })}
                    className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
                  >
                    <option value="L">Male</option>
                    <option value="P">Female</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-navy">Category</span>
                  <select
                    value={p.category}
                    onChange={(e) => updateParticipant(i, { category: e.target.value as Category })}
                    className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c} — {formatIDR(getCategoryPrice(c))}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-navy">Jersey Size</span>
                  <select
                    value={p.jersey_size}
                    onChange={(e) => updateParticipant(i, { jersey_size: e.target.value as JerseySize })}
                    className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
                  >
                    {JERSEY_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addParticipant}
          className="mt-4 rounded-full border-2 border-navy px-5 py-2.5 font-semibold text-navy transition hover:bg-navy hover:text-cream"
        >
          + Add Participant
        </button>
      </section>

      <section className="rounded-2xl bg-navy p-6 text-cream sm:p-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Total Payment</h2>
          <p className="font-display text-3xl text-lime">{formatIDR(transferAmount)}</p>
        </div>
        {/* <p className="mt-1 text-sm text-cream/70">
          Please adda unique code (
          {PAYMENT.uniqueCode}) in the last 3 digits so our committee can match your payment.
        </p> */}

        <div className="mt-6 rounded-xl bg-white/10 p-4 text-sm">
          <p className="font-semibold">Transfer to:</p>
          <p className="mt-1 text-base text-cream/90">{PAYMENT.bankName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="font-display text-2xl tracking-wide text-lime sm:text-3xl">
              {PAYMENT.accountNumber}
            </p>
            <button
              type="button"
              onClick={handleCopyAccountNumber}
              className="rounded-full border border-cream/40 px-4 py-1.5 text-xs font-semibold tracking-wide text-cream transition hover:bg-cream hover:text-navy"
            >
              {copied ? "COPIED ✓" : "COPY"}
            </button>
          </div>
          <p className="mt-2 text-base text-cream/90">Account holder: {PAYMENT.accountHolder}</p>
          <p className="mt-3 border-t border-white/10 pt-3">
            Please transfer the exact amount shown above —{" "}
            <span className="font-display text-lime">{formatIDR(transferAmount)}</span>
          </p>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-semibold">Upload Payment Proof</span>
          <input
            required
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileChange}
            className="mt-1 block w-full rounded-lg border border-cream/30 bg-white/5 px-4 py-2.5 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-orange file:px-4 file:py-2 file:font-semibold file:text-cream"
          />
          <span className="mt-1 block text-xs text-cream/60">JPG, PNG, or PDF format, max 5MB.</span>
        </label>
      </section>

      {error && (
        <p className="rounded-lg bg-orange/10 px-4 py-3 text-sm font-semibold text-orange-dark">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="font-display w-full rounded-full bg-orange py-4 text-lg tracking-wide text-cream shadow-lg transition hover:bg-orange-dark disabled:opacity-60 sm:w-auto sm:px-12"
      >
        {submitting ? "SUBMITTING..." : "REGISTER NOW"}
      </button>
    </form>
  );
}
