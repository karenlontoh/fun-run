import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERIFY_AUTH_COOKIE, isValidVerifyAuthCookie } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";
import { AGE_GROUPS, CATEGORIES, JERSEY_SIZES, JERSEY_SIZES_CHILD } from "@/lib/types";

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

  const { error } = await supabaseServer
    .from("participants")
    .update({ full_name, gender, category, jersey_size, age_group })
    .eq("id", id);

  if (error) {
    console.error("participant update failed", error);
    return NextResponse.json({ error: "Failed to update participant." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
