import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: participant } = await supabaseServer
    .from("charity_participants")
    .select("id")
    .eq("id", id)
    .single<{ id: string }>();

  if (!participant) {
    return NextResponse.json({ error: "Participant not found." }, { status: 404 });
  }

  const attendedAt = new Date().toISOString();
  const { error } = await supabaseServer
    .from("charity_participants")
    .update({ attended: true, attended_at: attendedAt })
    .eq("id", id);

  if (error) {
    console.error("charity check-in failed", error);
    return NextResponse.json({ error: "Failed to check in. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, attended_at: attendedAt });
}
