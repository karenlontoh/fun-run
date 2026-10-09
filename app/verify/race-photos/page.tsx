import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { RacePhotoManager } from "./RacePhotoManager";
import { supabaseServer } from "@/lib/supabase-server";
import { getRacePhotoPublicUrl } from "@/lib/storage";
import type { RacePhoto } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RacePhotosAdminPage() {
  const { data: photos } = await supabaseServer
    .from("race_photos")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<RacePhoto[]>();

  const rows = (photos ?? []).map((p) => ({
    photo: p,
    url: getRacePhotoPublicUrl(p.storage_path),
  }));

  const untaggedCount = rows.filter((r) => r.photo.bib_numbers.length === 0).length;

  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-sm tracking-[0.3em] text-orange">COMMITTEE ONLY</p>
              <h1 className="font-display mt-2 text-3xl text-navy sm:text-4xl">Race Photos</h1>
              <p className="mt-2 max-w-xl text-sm text-navy/60">
                Upload photos — each one is watermarked and automatically scanned for BIB numbers.
                Review the ones it couldn&apos;t tag below.
              </p>
            </div>
            <Link
              href="/verify"
              className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-navy-light"
            >
              ← Back to Fun Run Dashboard
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-navy/10 bg-white px-5 py-4">
              <p className="text-xs text-navy/50">Total Photos</p>
              <p className="font-display text-2xl text-navy">{rows.length}</p>
            </div>
            <div className="rounded-xl border border-navy/10 bg-white px-5 py-4">
              <p className="text-xs text-navy/50">Tagged</p>
              <p className="font-display text-2xl text-lime-dark">{rows.length - untaggedCount}</p>
            </div>
            <div className="rounded-xl border border-navy/10 bg-white px-5 py-4">
              <p className="text-xs text-navy/50">Needs Review</p>
              <p className="font-display text-2xl text-orange">{untaggedCount}</p>
            </div>
          </div>

          <RacePhotoManager initialRows={rows} />
        </div>
      </main>
      <Footer />
    </>
  );
}
