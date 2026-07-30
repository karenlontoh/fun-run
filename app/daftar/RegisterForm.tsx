"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, JERSEY_SIZES, type Category, type Gender, type JerseySize } from "@/lib/types";

type ParticipantForm = {
  full_name: string;
  gender: Gender;
  category: Category;
  jersey_size: JerseySize;
};

function emptyParticipant(): ParticipantForm {
  return { full_name: "", gender: "L", category: CATEGORIES[0], jersey_size: "M" };
}

export function RegisterForm() {
  const router = useRouter();
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [participants, setParticipants] = useState<ParticipantForm[]>([emptyParticipant()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateParticipant(index: number, patch: Partial<ParticipantForm>) {
    setParticipants((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function addParticipant() {
    setParticipants((prev) => [...prev, emptyParticipant()]);
  }

  function removeParticipant(index: number) {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          participants,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mendaftar. Coba lagi.");
        setSubmitting(false);
        return;
      }
      router.push(`/daftar/berhasil/${data.id}`);
    } catch {
      setError("Tidak bisa terhubung ke server. Periksa koneksi internet kamu.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section>
        <h2 className="font-display text-2xl text-navy">Data Kontak</h2>
        <p className="mt-1 text-sm text-navy/60">
          Kontak utama pendaftaran ini — QR code akan dikirim ke email ini.
        </p>
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
            <span className="text-sm font-semibold text-navy">No. Telepon / WhatsApp</span>
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-navy">Data Peserta</h2>
            <p className="mt-1 text-sm text-navy/60">
              Tambahkan semua peserta dalam grup ini. Setiap peserta dapat nomor BIB sendiri.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {participants.map((p, i) => (
            <div key={i} className="relative rounded-2xl border border-navy/15 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg text-orange">PESERTA {i + 1}</p>
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
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-navy">Nama Lengkap</span>
                  <input
                    required
                    value={p.full_name}
                    onChange={(e) => updateParticipant(i, { full_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
                    placeholder="Nama peserta"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-navy">Jenis Kelamin</span>
                  <select
                    value={p.gender}
                    onChange={(e) => updateParticipant(i, { gender: e.target.value as Gender })}
                    className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-navy">Kategori</span>
                  <select
                    value={p.category}
                    onChange={(e) => updateParticipant(i, { category: e.target.value as Category })}
                    className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-navy">Ukuran Jersey</span>
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
          + Tambah Peserta
        </button>
      </section>

      {error && (
        <p className="rounded-lg bg-orange/10 px-4 py-3 text-sm font-semibold text-orange-dark">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="font-display w-full rounded-full bg-orange py-4 text-lg tracking-wide text-cream shadow-lg transition hover:bg-orange-dark disabled:opacity-60 sm:w-auto sm:px-12"
      >
        {submitting ? "MENDAFTARKAN..." : "DAFTAR SEKARANG"}
      </button>
    </form>
  );
}
