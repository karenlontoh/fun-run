"use client";

import { useEffect, useState } from "react";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

function getTimeLeft(targetMs: number): TimeLeft {
  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    ended: false,
  };
}

const UNITS: { key: keyof Omit<TimeLeft, "ended">; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Sec" },
];

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const targetMs = new Date(targetDate).getTime();
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetMs));

  useEffect(() => {
    // The initial state already reflects the current time-left, so a reduced-motion
    // preference just means "don't keep ticking" — nothing to set synchronously here.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = setInterval(() => setTimeLeft(getTimeLeft(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (timeLeft.ended) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-cream/40 bg-cream/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-cream sm:text-sm">
        Registration is closed
      </div>
    );
  }

  return (
    <div>
      <p className="font-display text-xs tracking-[0.2em] text-lime sm:text-sm">
        REGISTRATION CLOSES IN
      </p>
      <div className="mt-2 flex gap-3 sm:gap-4">
        {UNITS.map(({ key, label }) => (
          <div
            key={key}
            className="flex w-16 flex-col items-center rounded-xl border border-cream/20 bg-white/5 py-2 sm:w-20 sm:py-3"
          >
            <p className="font-display text-2xl text-cream sm:text-3xl">
              {String(timeLeft[key]).padStart(2, "0")}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-cream/60 sm:text-xs">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
