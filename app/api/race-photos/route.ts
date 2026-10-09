import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERIFY_AUTH_COOKIE, isValidVerifyAuthCookie } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";
import { uploadRacePhoto, getRacePhotoPublicUrl } from "@/lib/storage";
import { applyWatermark } from "@/lib/watermark";
import { detectBibNumbersInImage } from "@/lib/bib-detection";
import type { RacePhoto } from "@/lib/types";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 20;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Public: search the gallery by BIB number.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const bibParam = url.searchParams.get("bib");
  const bib = Number(bibParam);

  if (!bibParam || !Number.isInteger(bib) || bib <= 0) {
    return NextResponse.json({ error: "A valid BIB number is required." }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("race_photos")
    .select("*")
    .contains("bib_numbers", [bib])
    .order("created_at", { ascending: false })
    .returns<RacePhoto[]>();

  if (error) {
    console.error("race photo search failed", error);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }

  const photos = (data ?? []).map((p) => ({
    id: p.id,
    url: getRacePhotoPublicUrl(p.storage_path),
  }));

  return NextResponse.json({ photos });
}

// Admin: bulk-upload photos. Each one is watermarked and run through
// automatic BIB detection (see lib/bib-detection.ts) before being stored.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const authorized = await isValidVerifyAuthCookie(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "At least one photo is required." }, { status: 400 });
  }
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return NextResponse.json(
      { error: `Upload at most ${MAX_FILES_PER_UPLOAD} photos at a time.` },
      { status: 400 }
    );
  }
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Photos must be JPG, PNG, or WEBP." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Each photo must be under 15MB." }, { status: 400 });
    }
  }

  const results: { id: string; bib_numbers: number[]; detection_failed: boolean }[] = [];

  for (const file of files) {
    const originalBuffer = Buffer.from(await file.arrayBuffer());

    let bibNumbers: number[] = [];
    let detectionFailed = false;
    try {
      bibNumbers = await detectBibNumbersInImage(originalBuffer);
    } catch (err) {
      console.error("BIB detection failed for a photo", err);
      detectionFailed = true;
    }

    const watermarked = await applyWatermark(originalBuffer);
    const id = crypto.randomUUID();
    const storagePath = `${id}.jpg`;

    const { error: uploadError } = await uploadRacePhoto(storagePath, watermarked, "image/jpeg");
    if (uploadError) {
      console.error("uploadRacePhoto failed", uploadError);
      continue;
    }

    const { error: insertError } = await supabaseServer.from("race_photos").insert({
      id,
      storage_path: storagePath,
      bib_numbers: bibNumbers,
    });
    if (insertError) {
      console.error("race_photos insert failed", insertError);
      continue;
    }

    results.push({ id, bib_numbers: bibNumbers, detection_failed: detectionFailed });
  }

  return NextResponse.json({ uploaded: results }, { status: 201 });
}
