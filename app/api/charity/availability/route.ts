import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { CHARITY_WALK } from "@/lib/event-config";

export async function GET() {
  const { count } = await supabaseServer
    .from("charity_participants")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({ full: (count ?? 0) >= CHARITY_WALK.maxParticipants });
}
