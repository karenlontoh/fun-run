"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateCharityTransferAmount, formatIDR } from "@/lib/pricing";
import { PAYMENT, CHARITY_WALK } from "@/lib/event-config";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function FunWalkForm() {
  const router = useRouter();
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [participantNames, setParticipantNames] = useState<string[]>([""]);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    async function checkAvailability() {
      try {
        const res = await fetch("/api/charity/availability");
        const data = await res.json();
        setFull(Boolean(data.full));
      } catch {
        // If the check fails, let the form through — the server enforces
        // the real cap on submit regardless.
      }
    }
    checkAvailability();
  }, []);

  const transferAmount = useMemo(
    () => calculateCharityTransferAmount(participantNames.length),
    [participantNames]
  );

  function updateName(index: number, value: string) {
    setParticipantNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  function addParticipant() {
    setParticipantNames((prev) => [...prev, ""]);
  }

  function removeParticipant(index: number) {
    setParticipantNames((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCopyAccountNumber() {
    try {
      await navigator.clipboard.writeText(PAYMENT.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing to fall back to.
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
      formData.set("full_names", JSON.stringify(participantNames));
      formData.set("payment_proof", paymentProof);

      const res = await fetch("/api/charity/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/fun-walk/berhasil/${data.id}`);
    } catch {
      setError("Couldn't connect to the server. Please check your internet connection.");
      setSubmitting(false);
    }
  }

  if (full) {
    return (
      <div className="rounded-2xl border border-orange/30 bg-orange/10 px-6 py-8 text-center">
        <p className="font-display text-2xl text-orange-dark">Registration Full</p>
        <p className="mt-2 text-navy/70">
          Thanks for your interest — all slots for the {CHARITY_WALK.name} have been taken.
        </p>
      </div>
    );
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
        <h2 className="font-display text-2xl text-navy">Participants</h2>
        <p className="mt-1 text-sm text-navy/60">
          Just names — no BIB, jersey, or category needed for the charity walk.
        </p>

        <div className="mt-5 space-y-3">
          {participantNames.map((name, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                required
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
                className="w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
                placeholder={`Participant ${i + 1}'s name`}
              />
              {participantNames.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeParticipant(i)}
                  className="text-sm font-semibold text-navy/50 hover:text-orange"
                >
                  Remove
                </button>
              )}
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
        <p className="mt-1 text-sm text-cream/70">
          {formatIDR(CHARITY_WALK.pricePerPerson)} × {participantNames.length} participant
          {participantNames.length === 1 ? "" : "s"}
        </p>

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
