import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { uploadPaymentProof } from "@/lib/storage";
import { calculateCharityTransferAmount } from "@/lib/pricing";
import { sendCharityAdminNotificationEmail, sendCharityRegistrationEmail } from "@/lib/email";
import { CHARITY_WALK } from "@/lib/event-config";
import type { CharityParticipant, CharityRegistration } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function validateFields(body: {
  contact_name: unknown;
  contact_email: unknown;
  contact_phone: unknown;
  full_names: unknown;
}): { ok: true; value: { contact_name: string; contact_email: string; contact_phone: string; full_names: string[] } } | { ok: false; error: string } {
  const contact_name = typeof body.contact_name === "string" ? body.contact_name.trim() : "";
  const contact_email = typeof body.contact_email === "string" ? body.contact_email.trim() : "";
  const contact_phone = typeof body.contact_phone === "string" ? body.contact_phone.trim() : "";

  if (!contact_name) return { ok: false, error: "Contact name is required." };
  if (!EMAIL_RE.test(contact_email)) return { ok: false, error: "Contact email is invalid." };
  if (!contact_phone) return { ok: false, error: "Contact phone number is required." };

  if (!Array.isArray(body.full_names) || body.full_names.length === 0) {
    return { ok: false, error: "At least 1 participant is required." };
  }
  if (body.full_names.length > 50) {
    return { ok: false, error: "Maximum 50 participants per registration." };
  }

  const full_names: string[] = [];
  for (const [i, raw] of body.full_names.entries()) {
    const name = typeof raw === "string" ? raw.trim() : "";
    if (!name) return { ok: false, error: `Participant ${i + 1}'s name is required.` };
    full_names.push(name);
  }

  return { ok: true, value: { contact_name, contact_email, contact_phone, full_names } };
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  let fullNamesRaw: unknown;
  try {
    fullNamesRaw = JSON.parse(String(formData.get("full_names") ?? "[]"));
  } catch {
    return NextResponse.json({ error: "Invalid participant data." }, { status: 400 });
  }

  const result = validateFields({
    contact_name: formData.get("contact_name"),
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone"),
    full_names: fullNamesRaw,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const { contact_name, contact_email, contact_phone, full_names } = result.value;

  const { count: currentParticipantCount } = await supabaseServer
    .from("charity_participants")
    .select("id", { count: "exact", head: true });
  if ((currentParticipantCount ?? 0) + full_names.length > CHARITY_WALK.maxParticipants) {
    return NextResponse.json(
      { error: "Sorry, the Charity Fun Walk is full. Registration is now closed." },
      { status: 409 }
    );
  }

  const paymentProof = formData.get("payment_proof");
  if (!(paymentProof instanceof File) || paymentProof.size === 0) {
    return NextResponse.json({ error: "Payment proof is required." }, { status: 400 });
  }
  if (paymentProof.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Payment proof must be under 5MB." }, { status: 400 });
  }
  const extension = ALLOWED_FILE_TYPES[paymentProof.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Payment proof must be JPG, PNG, WEBP, or PDF." },
      { status: 400 }
    );
  }

  const totalAmount = calculateCharityTransferAmount(full_names.length);

  type CreateCharityRow = { registration_id: string; participant_id: string; full_name: string };

  const { data, error } = await supabaseServer.rpc("create_charity_registration", {
    p_contact_name: contact_name,
    p_contact_email: contact_email,
    p_contact_phone: contact_phone,
    p_total_amount: totalAmount,
    p_full_names: full_names,
  });
  const rows = data as CreateCharityRow[] | null;

  if (error || !rows || rows.length === 0) {
    console.error("create_charity_registration failed", error);
    return NextResponse.json(
      { error: "Failed to save your registration. Please try again shortly." },
      { status: 500 }
    );
  }

  const registrationId = rows[0].registration_id;
  const proofPath = `charity/${registrationId}/payment-proof.${extension}`;

  const { error: uploadError } = await uploadPaymentProof(proofPath, paymentProof);
  if (uploadError) {
    console.error("uploadPaymentProof failed", uploadError);
    await supabaseServer.from("charity_registrations").delete().eq("id", registrationId);
    return NextResponse.json(
      { error: "Failed to upload payment proof. Please try again." },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabaseServer
    .from("charity_registrations")
    .update({ payment_proof_path: proofPath })
    .eq("id", registrationId);
  if (updateError) {
    console.error("update payment_proof_path failed", updateError);
    await supabaseServer.from("charity_registrations").delete().eq("id", registrationId);
    return NextResponse.json(
      { error: "Failed to save payment proof. Please try again." },
      { status: 500 }
    );
  }

  try {
    const { data: fullParticipants } = await supabaseServer
      .from("charity_participants")
      .select("*")
      .eq("registration_id", registrationId)
      .returns<CharityParticipant[]>();

    const registration: CharityRegistration = {
      id: registrationId,
      created_at: new Date().toISOString(),
      contact_name,
      contact_email,
      contact_phone,
      total_amount: totalAmount,
      payment_proof_path: proofPath,
      payment_status: "pending",
      payment_method: "transfer",
    };

    const { error: emailError } = await sendCharityRegistrationEmail({
      to: contact_email,
      contactName: contact_name,
      registrationId,
    });
    if (emailError) {
      console.error("sendCharityRegistrationEmail failed", emailError);
    }

    const { error: notifyError } = await sendCharityAdminNotificationEmail({
      registration,
      participants: fullParticipants ?? [],
    });
    if (notifyError) {
      console.error("sendCharityAdminNotificationEmail failed", notifyError);
    }
  } catch (err) {
    console.error("Email delivery failed", err);
  }

  return NextResponse.json({ id: registrationId, total_amount: totalAmount }, { status: 201 });
}
