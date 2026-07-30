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
  const checkedInAt = new Date().toISOString();

  const { error } = await supabaseServer
    .from("participants")
    .update({ checked_in: true, checked_in_at: checkedInAt })
    .eq("id", id);

  if (error) {
    console.error("checkin failed", error);
    return NextResponse.json({ error: "Failed to update check-in status." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checked_in_at: checkedInAt });
}
