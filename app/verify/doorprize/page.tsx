import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { DoorprizeStage } from "@/app/verify/doorprize/DoorprizeStage";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function DoorprizePage() {
  const { count } = await supabaseServer
    .from("participants")
    .select("*", { count: "exact", head: true })
    .eq("attended", true)
    .eq("doorprize_won", false);

  return (
    <>
      <NavBar />
      <main className="flex flex-1 flex-col bg-cream">
        <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-14 sm:py-20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-sm tracking-[0.3em] text-orange">RACE DAY</p>
              <h1 className="font-display mt-2 text-3xl text-navy sm:text-4xl">Doorprize</h1>
            </div>
            <Link
              href="/verify/attendance"
              className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-navy-light"
            >
              ← Back to Check-In
            </Link>
          </div>

          <DoorprizeStage initialEligibleCount={count ?? 0} />
        </div>
      </main>
    </>
  );
}
