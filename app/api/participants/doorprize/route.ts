import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERIFY_AUTH_COOKIE, getVerifyRole } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";
import type { Participant } from "@/lib/types";

// Admin: randomly picks one checked-in participant who hasn't won a
// doorprize yet, and marks them won so they're excluded from future picks.
export async function POST() {
  const cookieStore = await cookies();
  const role = await getVerifyRole(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: eligible, error } = await supabaseServer
    .from("participants")
    .select("id")
    .eq("attended", true)
    .eq("doorprize_won", false);

  if (error) {
    console.error("doorprize eligible lookup failed", error);
    return NextResponse.json({ error: "Failed to pick a winner. Try again." }, { status: 500 });
  }
  if (!eligible || eligible.length === 0) {
    return NextResponse.json(
      { error: "Everyone who's checked in has already won a doorprize." },
      { status: 400 }
    );
  }

  const pick = eligible[Math.floor(Math.random() * eligible.length)];
  const wonAt = new Date().toISOString();

  // The doorprize_won=false condition in the WHERE clause guards against a
  // double-click or near-simultaneous pick landing on the same person twice.
  const { data: winner, error: updateError } = await supabaseServer
    .from("participants")
    .update({ doorprize_won: true, doorprize_won_at: wonAt })
    .eq("id", pick.id)
    .eq("doorprize_won", false)
    .select("*")
    .single<Participant>();

  if (updateError || !winner) {
    return NextResponse.json({ error: "That pick was just claimed — try again." }, { status: 409 });
  }

  return NextResponse.json({ winner });
}
