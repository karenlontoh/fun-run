import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERIFY_AUTH_COOKIE, isValidVerifyAuthCookie } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const authorized = await isValidVerifyAuthCookie(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.verified !== "boolean") {
    return NextResponse.json({ error: "Missing or invalid 'verified' field." }, { status: 400 });
  }

  const { id } = await params;

  const { error } = await supabaseServer
    .from("registrations")
    .update({ payment_verified: body.verified })
    .eq("id", id);

  if (error) {
    console.error("verify-payment failed", error);
    return NextResponse.json({ error: "Failed to update payment verification status." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, payment_verified: body.verified });
}
