import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import type { CharityParticipant } from "@/lib/types";

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 8;

// Fun Walk has no BIB numbers, so check-in looks participants up by name —
// this only ever returns matches for what's actually typed, never the full
// roster, both to keep the response small and so this endpoint can't be
// used to browse everyone's name.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ participants: [] });
  }

  const { data, error } = await supabaseServer
    .from("charity_participants")
    .select("id, full_name, gender, institution, attended, attended_at")
    .ilike("full_name", `%${query}%`)
    .order("full_name", { ascending: true })
    .limit(RESULT_LIMIT)
    .returns<
      Pick<CharityParticipant, "id" | "full_name" | "gender" | "institution" | "attended" | "attended_at">[]
    >();

  if (error) {
    console.error("charity check-in search failed", error);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ participants: data ?? [] });
}
