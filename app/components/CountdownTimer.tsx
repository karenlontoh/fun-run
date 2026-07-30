"use client";

import { useEffect, useState } from "react";

type CountdownTimerProps = {
  targetIso: string;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(targetIso: string): TimeLeft | null {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display animate-tick w-20 rounded-2xl border-2 border-orange bg-cream/10 py-4 text-center text-5xl text-lime shadow-lg sm:w-28 sm:py-5 sm:text-7xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-3 text-xs tracking-[0.25em] text-cream/60 sm:text-sm">{label}</span>
    </div>
  );
}

export function CountdownTimer({ targetIso }: CountdownTimerProps) {
  // undefined = not computed yet (avoids any server/client hydration mismatch),
  // null = registration closed, otherwise the live countdown.
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null | undefined>(undefined);

  useEffect(() => {
    const tick = () => setTimeLeft(getTimeLeft(targetIso));
    const timeout = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [targetIso]);

  if (timeLeft === undefined) {
    return <div className="h-[112px] sm:h-[160px]" aria-hidden />;
  }

  if (timeLeft === null) {
    return (
      <p className="font-display text-3xl text-lime sm:text-4xl">REGISTRATION IS NOW CLOSED</p>
    );
  }

  return (
    <div className="flex justify-center gap-4 sm:gap-8">
      <Unit value={timeLeft.days} label="DAYS" />
      <Unit value={timeLeft.hours} label="HOURS" />
      <Unit value={timeLeft.minutes} label="MINS" />
      <Unit value={timeLeft.seconds} label="SECS" />
    </div>
  );
}
