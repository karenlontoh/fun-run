import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import type { Participant } from "@/lib/types";

function parseBib(raw: string): number | null {
  const bib = Number(raw);
  return Number.isInteger(bib) && bib > 0 ? bib : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ bib: string }> }) {
  const { bib: rawBib } = await params;
  const bib = parseBib(rawBib);
  if (bib === null) {
    return NextResponse.json({ error: "Invalid BIB number." }, { status: 400 });
  }

  const { data: participant } = await supabaseServer
    .from("participants")
    .select("id, bib_number, full_name, category, gender, attended, attended_at")
    .eq("bib_number", bib)
    .single<
      Pick<Participant, "id" | "bib_number" | "full_name" | "category" | "gender" | "attended" | "attended_at">
    >();

  if (!participant) {
    return NextResponse.json({ error: "BIB number not found." }, { status: 404 });
  }

  return NextResponse.json({ participant });
}

export async function POST(_request: Request, { params }: { params: Promise<{ bib: string }> }) {
  const { bib: rawBib } = await params;
  const bib = parseBib(rawBib);
  if (bib === null) {
    return NextResponse.json({ error: "Invalid BIB number." }, { status: 400 });
  }

  const { data: participant } = await supabaseServer
    .from("participants")
    .select("id")
    .eq("bib_number", bib)
    .single<{ id: string }>();

  if (!participant) {
    return NextResponse.json({ error: "BIB number not found." }, { status: 404 });
  }

  const attendedAt = new Date().toISOString();
  const { error } = await supabaseServer
    .from("participants")
    .update({ attended: true, attended_at: attendedAt })
    .eq("id", participant.id);

  if (error) {
    console.error("public checkin failed", error);
    return NextResponse.json({ error: "Failed to check in. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, attended_at: attendedAt });
}
