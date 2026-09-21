"use client";

import { useState } from "react";
import { CollectRacePackButton } from "@/app/components/CollectRacePackButton";
import {
  CATEGORIES,
  jerseySizesFor,
  type AgeGroup,
  type Category,
  type Gender,
  type JerseySize,
  type Participant,
} from "@/lib/types";

const AGE_GROUP_LABEL: Record<AgeGroup, string> = { anak: "Anak", dewasa: "Dewasa" };

export function ParticipantEditor({ participant }: { participant: Participant }) {
  const [current, setCurrent] = useState(participant);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(current.full_name);
  const [gender, setGender] = useState<Gender>(current.gender);
  const [category, setCategory] = useState<Category>(current.category as Category);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(current.age_group);
  const [jerseySize, setJerseySize] = useState(current.jersey_size);

  function startEditing() {
    setFullName(current.full_name);
    setGender(current.gender);
    setCategory(current.category as Category);
    setAgeGroup(current.age_group);
    setJerseySize(current.jersey_size);
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!fullName.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/participants/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          gender,
          category,
          jersey_size: jerseySize,
          age_group: ageGroup,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Failed to save. Try again.");
        return;
      }
      setCurrent((prev) => ({
        ...prev,
        full_name: fullName.trim(),
        gender,
        category,
        jersey_size: jerseySize,
        age_group: ageGroup,
      }));
      setEditing(false);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    const sizeOptions = jerseySizesFor(ageGroup);
    return (
      <div className="rounded-xl border border-orange/40 bg-white px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-navy/60">Full Name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy/60">Gender</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none"
            >
              <option value="L">Male</option>
              <option value="P">Female</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy/60">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy/60">Age Group</span>
            <select
              value={ageGroup}
              onChange={(e) => {
                const nextAgeGroup = e.target.value as AgeGroup;
                setAgeGroup(nextAgeGroup);
                const options = jerseySizesFor(nextAgeGroup);
                if (!options.includes(jerseySize)) {
                  setJerseySize(options[0]);
                }
              }}
              className="mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none"
            >
              <option value="anak">Anak</option>
              <option value="dewasa">Dewasa</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy/60">Jersey Size</span>
            <select
              value={jerseySize}
              onChange={(e) => setJerseySize(e.target.value as JerseySize)}
              className="mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm focus:border-orange focus:outline-none"
            >
              {sizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
    <div className="rounded-xl border border-navy/10 bg-white px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-navy">{current.full_name}</p>
          <p className="text-sm text-navy/60">
            {current.category} · {current.gender === "L" ? "Male" : "Female"} ·{" "}
            {AGE_GROUP_LABEL[current.age_group]} · Jersey {current.jersey_size}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-navy/50">BIB</p>
            <p className="font-display text-2xl text-orange">{current.bib_number}</p>
          </div>
          <button
            type="button"
            onClick={startEditing}
            className="text-sm font-semibold text-navy/50 hover:text-orange"
          >
            Edit
          </button>
        </div>
      </div>
      <div className="mt-3 border-t border-navy/10 pt-3">
        <CollectRacePackButton
          participantId={current.id}
          initialCheckedIn={current.checked_in}
          initialCheckedInAt={current.checked_in_at}
        />
      </div>
    </div>
  );
}
