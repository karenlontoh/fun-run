import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { AttendanceTable } from "@/app/verify/attendance/AttendanceTable";
import { supabaseServer } from "@/lib/supabase-server";
import type { Participant } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const { data: participants } = await supabaseServer
    .from("participants")
    .select("*")
    .eq("attended", true)
    .order("attended_at", { ascending: true })
    .returns<Participant[]>();

  const rows = participants ?? [];

  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-sm tracking-[0.3em] text-orange">COMMITTEE ONLY</p>
              <h1 className="font-display mt-2 text-3xl text-navy sm:text-4xl">Race Day Check-In</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/verify/doorprize"
                className="rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-orange-dark"
              >
                🎉 Doorprize
              </Link>
              <Link
                href="/verify"
                className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-navy-light"
              >
                ← Back to Fun Run Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-navy/10 bg-white px-5 py-4">
            <p className="text-xs text-navy/50">Checked In</p>
            <p className="font-display text-2xl text-lime-dark">{rows.length}</p>
          </div>

          <AttendanceTable rows={rows} />
        </div>
      </main>
      <Footer />
    </>
  );
}
