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
const UPLOAD_CONCURRENCY = 5;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PAGE_SIZE = 50;

// Processing photos one at a time (each one waiting on a Gemini API call)
// was unusably slow for a real batch — this gives the function more
// headroom than the 10s default, on top of the concurrency below.
export const maxDuration = 60;

// Public: browse the gallery (paginated), optionally filtered by BIB number.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const bibParam = url.searchParams.get("bib");
  const page = Math.max(1, Math.trunc(Number(url.searchParams.get("page"))) || 1);

  let query = supabaseServer
    .from("race_photos")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (bibParam) {
    const bib = Number(bibParam);
    if (!Number.isInteger(bib) || bib <= 0) {
      return NextResponse.json({ error: "A valid BIB number is required." }, { status: 400 });
    }
    query = query.contains("bib_numbers", [bib]);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1).returns<RacePhoto[]>();

  if (error) {
    console.error("race photo search failed", error);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }

  const photos = (data ?? []).map((p) => ({
    id: p.id,
    url: getRacePhotoPublicUrl(p.storage_path),
  }));

  return NextResponse.json({ photos, total: count ?? 0, page, pageSize: PAGE_SIZE });
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

  type UploadResult = { id: string; bib_numbers: number[]; detection_failed: boolean };

  async function processFile(file: File): Promise<UploadResult | null> {
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
      return null;
    }

    const { error: insertError } = await supabaseServer.from("race_photos").insert({
      id,
      storage_path: storagePath,
      bib_numbers: bibNumbers,
    });
    if (insertError) {
      console.error("race_photos insert failed", insertError);
      return null;
    }

    return { id, bib_numbers: bibNumbers, detection_failed: detectionFailed };
  }

  // Processed in small concurrent batches rather than one giant Promise.all
  // (to stay polite to Gemini's rate limits) or one at a time (which made a
  // 20-photo batch take minutes — each photo waits on its own Gemini call).
  const results: UploadResult[] = [];
  for (let i = 0; i < files.length; i += UPLOAD_CONCURRENCY) {
    const chunk = files.slice(i, i + UPLOAD_CONCURRENCY);
    const chunkResults = await Promise.all(chunk.map(processFile));
    for (const r of chunkResults) {
      if (r) results.push(r);
    }
  }

  return NextResponse.json({ uploaded: results }, { status: 201 });
}
