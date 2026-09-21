"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  jerseySizesFor,
  type AgeGroup,
  type Category,
  type Gender,
  type PaymentMethod,
} from "@/lib/types";
import { calculateTransferAmount, formatIDR, getCategoryPrice } from "@/lib/pricing";

type ParticipantForm = {
  full_name: string;
  gender: Gender;
  category: Category;
  age_group: AgeGroup;
  jersey_size: string;
};

function emptyParticipant(): ParticipantForm {
  return { full_name: "", gender: "L", category: CATEGORIES[0], age_group: "dewasa", jersey_size: "M" };
}

export function AddParticipantForm() {
  const router = useRouter();
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [participants, setParticipants] = useState<ParticipantForm[]>([emptyParticipant()]);
  const [paid, setPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = useMemo(
    () => calculateTransferAmount(participants.map((p) => p.category)),
    [participants]
  );

  function updateParticipant(index: number, patch: Partial<ParticipantForm>) {
    setParticipants((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function updateAgeGroup(index: number, ageGroup: AgeGroup) {
    setParticipants((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const options = jerseySizesFor(ageGroup);
        return { ...p, age_group: ageGroup, jersey_size: options.includes(p.jersey_size) ? p.jersey_size : options[0] };
      })
    );
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
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          paid,
          payment_method: paymentMethod,
          participants,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/verify/${data.id}`);
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
              placeholder="Contact's name"
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
        <h2 className="font-display text-2xl text-navy">Participant Details</h2>
        <p className="mt-1 text-sm text-navy/60">
          Name can be filled with &quot;TBA&quot; for now and edited later from the group&apos;s page.
        </p>

        <div className="mt-5 space-y-5">
          {participants.map((p, i) => {
            const sizeOptions = jerseySizesFor(p.age_group);
            return (
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
                      placeholder="Participant's name, or TBA"
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
                    <span className="text-sm font-semibold text-navy">Age Group</span>
                    <select
                      value={p.age_group}
                      onChange={(e) => updateAgeGroup(i, e.target.value as AgeGroup)}
                      className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
                    >
                      <option value="anak">Anak</option>
                      <option value="dewasa">Dewasa</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-navy">Jersey Size</span>
                    <select
                      value={p.jersey_size}
                      onChange={(e) => updateParticipant(i, { jersey_size: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
                    >
                      {sizeOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            );
          })}
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
          <p className="font-display text-3xl text-lime">{formatIDR(totalAmount)}</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Sudah Bayar?</span>
            <select
              value={paid ? "yes" : "no"}
              onChange={(e) => setPaid(e.target.value === "yes")}
              className="mt-1 w-full rounded-lg border border-cream/30 bg-white/5 px-4 py-2.5 text-cream focus:border-lime focus:outline-none"
            >
              <option value="yes" className="text-navy">
                Sudah
              </option>
              <option value="no" className="text-navy">
                Belum
              </option>
            </select>
          </label>
          {paid && (
            <label className="block">
              <span className="text-sm font-semibold">Metode Pembayaran</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="mt-1 w-full rounded-lg border border-cream/30 bg-white/5 px-4 py-2.5 text-cream focus:border-lime focus:outline-none"
              >
                <option value="cash" className="text-navy">
                  Cash
                </option>
                <option value="transfer" className="text-navy">
                  Transfer
                </option>
              </select>
            </label>
          )}
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-orange/10 px-4 py-3 text-sm font-semibold text-orange-dark">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="font-display w-full rounded-full bg-orange py-4 text-lg tracking-wide text-cream shadow-lg transition hover:bg-orange-dark disabled:opacity-60 sm:w-auto sm:px-12"
      >
        {submitting ? "SAVING..." : "SAVE REGISTRATION"}
      </button>
    </form>
  );
}
