import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERIFY_AUTH_COOKIE, isValidVerifyAuthCookie } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";
import { uploadPaymentProof } from "@/lib/storage";
import { PAYMENT_METHODS, PAYMENT_STATUSES, type PaymentMethod, type PaymentStatus } from "@/lib/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const authorized = await isValidVerifyAuthCookie(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const status = formData.get("status");
  const rawMethod = formData.get("payment_method");
  if (!PAYMENT_STATUSES.includes(status as PaymentStatus)) {
    return NextResponse.json({ error: "Missing or invalid 'status' field." }, { status: 400 });
  }
  // Empty string means "not set yet" — a real state, not an omission.
  let payment_method: PaymentMethod | null = null;
  if (rawMethod !== "" && rawMethod !== null) {
    if (!PAYMENT_METHODS.includes(rawMethod as PaymentMethod)) {
      return NextResponse.json({ error: "Invalid 'payment_method' field." }, { status: 400 });
    }
    payment_method = rawMethod as PaymentMethod;
  }

  const { id } = await params;
  const update: Record<string, string | null> = {
    payment_status: status as PaymentStatus,
    payment_method,
  };

  const paymentProof = formData.get("payment_proof");
  if (payment_method === "transfer" && paymentProof instanceof File && paymentProof.size > 0) {
    if (paymentProof.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Payment proof must be under 5MB." }, { status: 400 });
    }
    const extension = ALLOWED_FILE_TYPES[paymentProof.type];
    if (!extension) {
      return NextResponse.json({ error: "Payment proof must be JPG, PNG, WEBP, or PDF." }, { status: 400 });
    }
    const path = `${id}/payment-proof.${extension}`;
    const { error: uploadError } = await uploadPaymentProof(path, paymentProof);
    if (uploadError) {
      console.error("uploadPaymentProof failed", uploadError);
      return NextResponse.json({ error: "Failed to upload payment proof." }, { status: 500 });
    }
    update.payment_proof_path = path;
  }

  const { error } = await supabaseServer.from("registrations").update(update).eq("id", id);
  if (error) {
    console.error("registration payment update failed", error);
    return NextResponse.json({ error: "Failed to update payment info." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
