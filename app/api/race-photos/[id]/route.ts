import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERIFY_AUTH_COOKIE, isValidVerifyAuthCookie } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";
import { deleteRacePhoto } from "@/lib/storage";
import type { RacePhoto } from "@/lib/types";

// Admin: manually correct a photo's BIB tags (auto-detection misses some,
// or occasionally gets one wrong).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const authorized = await isValidVerifyAuthCookie(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.bib_numbers)) {
    return NextResponse.json({ error: "bib_numbers must be an array." }, { status: 400 });
  }

  const bibNumbers = body.bib_numbers.map((n: unknown) => Number(n));
  if (bibNumbers.some((n: number) => !Number.isInteger(n) || n <= 0)) {
    return NextResponse.json({ error: "bib_numbers must all be positive integers." }, { status: 400 });
  }

  const { id } = await params;
  const { error } = await supabaseServer
    .from("race_photos")
    .update({ bib_numbers: bibNumbers })
    .eq("id", id);

  if (error) {
    console.error("race photo tag update failed", error);
    return NextResponse.json({ error: "Failed to update tags." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const authorized = await isValidVerifyAuthCookie(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const { data: photo } = await supabaseServer
    .from("race_photos")
    .select("*")
    .eq("id", id)
    .single<RacePhoto>();

  if (!photo) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  await deleteRacePhoto(photo.storage_path);

  const { error } = await supabaseServer.from("race_photos").delete().eq("id", id);
  if (error) {
    console.error("race photo delete failed", error);
    return NextResponse.json({ error: "Failed to delete photo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
