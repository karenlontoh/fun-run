import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERIFY_AUTH_COOKIE, isValidVerifyAuthCookie } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const authorized = await isValidVerifyAuthCookie(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const attendedAt = new Date().toISOString();

  const { error } = await supabaseServer
    .from("participants")
    .update({ attended: true, attended_at: attendedAt })
    .eq("id", id);

  if (error) {
    console.error("attend failed", error);
    return NextResponse.json({ error: "Failed to record attendance." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, attended_at: attendedAt });
}
