import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERIFY_AUTH_COOKIE, isValidVerifyAuthCookie } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";
import { AGE_GROUPS, CATEGORIES, JERSEY_SIZES, JERSEY_SIZES_CHILD } from "@/lib/types";
import { calculateTransferAmount } from "@/lib/pricing";

const ALL_JERSEY_SIZES = new Set<string>([...JERSEY_SIZES, ...JERSEY_SIZES_CHILD]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const authorized = await isValidVerifyAuthCookie(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const full_name = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const { gender, category, jersey_size, age_group } = body;

  if (!full_name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (gender !== "L" && gender !== "P") {
    return NextResponse.json({ error: "Invalid gender." }, { status: 400 });
  }
  if (typeof category !== "string" || !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (typeof jersey_size !== "string" || !ALL_JERSEY_SIZES.has(jersey_size)) {
    return NextResponse.json({ error: "Invalid jersey size." }, { status: 400 });
  }
  if (typeof age_group !== "string" || !AGE_GROUPS.includes(age_group as (typeof AGE_GROUPS)[number])) {
    return NextResponse.json({ error: "Invalid age group." }, { status: 400 });
  }

  const { id } = await params;

  const { data: existing, error: fetchError } = await supabaseServer
    .from("participants")
    .select("registration_id, category, bib_number")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Participant not found." }, { status: 404 });
  }

  // Bib numbers are assigned per category (2.5K vs 5K ranges) — if the
  // category changed, the participant needs a fresh bib from the new range
  // instead of keeping a stale one from the old category's sequence.
  let bib_number = existing.bib_number;
  if (category !== existing.category) {
    const { data: newBib, error: bibError } = await supabaseServer.rpc("next_bib_number", {
      p_category: category,
    });
    if (bibError || typeof newBib !== "number") {
      console.error("bib reassignment failed", bibError);
      return NextResponse.json({ error: "Failed to assign a new bib number." }, { status: 500 });
    }
    bib_number = newBib;
  }

  const { error } = await supabaseServer
    .from("participants")
    .update({ full_name, gender, category, jersey_size, age_group, bib_number })
    .eq("id", id);

  if (error) {
    console.error("participant update failed", error);
    return NextResponse.json({ error: "Failed to update participant." }, { status: 500 });
  }

  // Category edits change the price, so the parent registration's total
  // (what the committee expects to have been paid) must be recalculated
  // from every participant's current category — not left stale.
  const { data: siblings, error: siblingsError } = await supabaseServer
    .from("participants")
    .select("category")
    .eq("registration_id", existing.registration_id);

  if (siblingsError || !siblings) {
    console.error("failed to recalculate total_amount", siblingsError);
    return NextResponse.json({ error: "Participant updated, but failed to recalculate total amount." }, { status: 500 });
  }

  const total_amount = calculateTransferAmount(siblings.map((p) => p.category));

  const { error: totalError } = await supabaseServer
    .from("registrations")
    .update({ total_amount })
    .eq("id", existing.registration_id);

  if (totalError) {
    console.error("failed to update total_amount", totalError);
    return NextResponse.json({ error: "Participant updated, but failed to recalculate total amount." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
