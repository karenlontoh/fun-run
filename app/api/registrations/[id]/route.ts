import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERIFY_AUTH_COOKIE, isValidVerifyAuthCookie } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";
import { deletePaymentProof } from "@/lib/storage";
import type { Registration } from "@/lib/types";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const authorized = await isValidVerifyAuthCookie(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const { data: registration } = await supabaseServer
    .from("registrations")
    .select("payment_proof_path")
    .eq("id", id)
    .single<Pick<Registration, "payment_proof_path">>();

  if (registration?.payment_proof_path) {
    const { error: removeError } = await deletePaymentProof(registration.payment_proof_path);
    if (removeError) {
      // Not fatal — an orphaned storage file is a minor cleanup issue, not a reason to block the delete.
      console.error("deletePaymentProof failed", removeError);
    }
  }

  // participants cascade-delete automatically (on delete cascade in schema).
  const { error } = await supabaseServer.from("registrations").delete().eq("id", id);
  if (error) {
    console.error("registration delete failed", error);
    return NextResponse.json({ error: "Failed to delete registration." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
