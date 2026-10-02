"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateCharityMinAmount, formatIDR } from "@/lib/pricing";
import { PAYMENT, CHARITY_WALK } from "@/lib/event-config";
import type { Gender } from "@/lib/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type ParticipantForm = {
  full_name: string;
  gender: Gender;
};

function emptyParticipant(): ParticipantForm {
  return { full_name: "", gender: "L" };
}

export function FunWalkForm() {
  const router = useRouter();
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [participants, setParticipants] = useState<ParticipantForm[]>([emptyParticipant()]);
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

  const minAmount = useMemo(
    () => calculateCharityMinAmount(participants.length),
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
      // Clipboard API unavailable — nothing to fall back to.
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_FILE_SIZE) {
      setError("Ukuran file bukti pembayaran harus di bawah 5MB.");
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
      setError("Bukti pembayaran wajib diunggah.");
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

      const res = await fetch("/api/charity/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Pendaftaran gagal. Silakan coba lagi.");
        setSubmitting(false);
        return;
      }
      router.push(`/fun-walk/berhasil/${data.id}`);
    } catch {
      setError("Tidak bisa terhubung ke server. Periksa koneksi internet kamu.");
      setSubmitting(false);
    }
  }

  if (full) {
    return (
      <div className="rounded-2xl border border-orange/30 bg-orange/10 px-6 py-8 text-center">
        <p className="font-display text-2xl text-orange-dark">Pendaftaran Penuh</p>
        <p className="mt-2 text-navy/70">
          Terima kasih atas minatmu — semua slot untuk {CHARITY_WALK.name} sudah terisi.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section>
        <h2 className="font-display text-2xl text-navy">Detail Kontak</h2>
        <p className="mt-1 text-sm text-navy/60">Kontak utama untuk pendaftaran grup ini.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-navy">Nama Lengkap</span>
            <input
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
              placeholder="Nama kamu"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-navy">Nomor HP / WhatsApp</span>
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
              placeholder="nama@email.com"
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">Peserta</h2>

        <div className="mt-5 space-y-3">
          {participants.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                required
                value={p.full_name}
                onChange={(e) => updateParticipant(i, { full_name: e.target.value })}
                className="w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
                placeholder={`Nama peserta ${i + 1}`}
              />
              <select
                value={p.gender}
                onChange={(e) => updateParticipant(i, { gender: e.target.value as Gender })}
                className="rounded-lg border border-navy/20 px-3 py-2.5 focus:border-orange focus:outline-none"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
              {participants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeParticipant(i)}
                  className="text-sm font-semibold text-navy/50 hover:text-orange"
                >
                  Hapus
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
          + Tambah Peserta
        </button>
      </section>

      <section className="rounded-2xl bg-navy p-6 text-cream sm:p-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Donasi</h2>
          <p className="font-display text-3xl text-lime">{formatIDR(minAmount)}</p>
        </div>
        <p className="mt-1 text-sm text-cream/70">
          {formatIDR(CHARITY_WALK.minPerPerson)} per orang untuk {participants.length} peserta
        </p>

        <div className="mt-6 rounded-xl bg-white/10 p-4 text-sm">
          <p className="font-semibold">Transfer ke:</p>
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
              {copied ? "TERSALIN ✓" : "SALIN"}
            </button>
          </div>
          <p className="mt-2 text-base text-cream/90">Atas nama: {PAYMENT.accountHolder}</p>
          <p className="mt-3 border-t border-white/10 pt-3">
            Transfer minimal{" "}
            <span className="font-display text-lime">{formatIDR(minAmount)}</span>. Donasi lebih
            dari itu dipersilakan.
          </p>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-semibold">Unggah Bukti Pembayaran</span>
          <input
            required
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileChange}
            className="mt-1 block w-full rounded-lg border border-cream/30 bg-white/5 px-4 py-2.5 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-orange file:px-4 file:py-2 file:font-semibold file:text-cream"
          />
          <span className="mt-1 block text-xs text-cream/60">Format JPG, PNG, atau PDF, maks 5MB.</span>
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
        {submitting ? "MENGIRIM..." : "DAFTAR SEKARANG"}
      </button>
    </form>
  );
}
