import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERIFY_AUTH_COOKIE, getVerifyRole } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";
import { getRacePhotoPublicUrl } from "@/lib/storage";
import { detectBibNumbersInImage } from "@/lib/bib-detection";
import type { RacePhoto } from "@/lib/types";

const RETAG_CONCURRENCY = 5;

export const maxDuration = 60;

// Admin: re-run BIB detection on already-uploaded photos (no re-upload
// needed — this re-fetches the stored, already-watermarked image). Mainly
// for photos that failed detection the first time, e.g. because Gemini was
// rate-limited by too many concurrent requests during a big batch upload.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const role = await getVerifyRole(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array." }, { status: 400 });
  }
  const ids: string[] = body.ids.filter((id: unknown): id is string => typeof id === "string");

  const { data: photos, error } = await supabaseServer
    .from("race_photos")
    .select("*")
    .in("id", ids)
    .returns<RacePhoto[]>();

  if (error || !photos) {
    console.error("retag: failed to load photos", error);
    return NextResponse.json({ error: "Failed to load photos." }, { status: 500 });
  }

  type RetagResult = { id: string; bib_numbers: number[]; changed: boolean };

  async function retagOne(photo: RacePhoto): Promise<RetagResult> {
    try {
      const res = await fetch(getRacePhotoPublicUrl(photo.storage_path));
      if (!res.ok) return { id: photo.id, bib_numbers: photo.bib_numbers, changed: false };

      const buffer = Buffer.from(await res.arrayBuffer());
      const bibNumbers = await detectBibNumbersInImage(buffer);
      if (bibNumbers.length === 0) {
        return { id: photo.id, bib_numbers: photo.bib_numbers, changed: false };
      }

      const { error: updateError } = await supabaseServer
        .from("race_photos")
        .update({ bib_numbers: bibNumbers })
        .eq("id", photo.id);
      if (updateError) {
        console.error("retag: update failed", photo.id, updateError);
        return { id: photo.id, bib_numbers: photo.bib_numbers, changed: false };
      }

      return { id: photo.id, bib_numbers: bibNumbers, changed: true };
    } catch (err) {
      console.error("retag failed for photo", photo.id, err);
      return { id: photo.id, bib_numbers: photo.bib_numbers, changed: false };
    }
  }

  const results: RetagResult[] = [];
  for (let i = 0; i < photos.length; i += RETAG_CONCURRENCY) {
    const chunk = photos.slice(i, i + RETAG_CONCURRENCY);
    results.push(...(await Promise.all(chunk.map(retagOne))));
  }

  return NextResponse.json({ results });
}
