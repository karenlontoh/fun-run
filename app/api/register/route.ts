import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { uploadPaymentProof } from "@/lib/storage";
import { calculateTransferAmount } from "@/lib/pricing";
import { generateRegistrationPdf } from "@/lib/pdf";
import { sendRegistrationEmail } from "@/lib/email";
import {
  CATEGORIES,
  JERSEY_SIZES,
  type Category,
  type JerseySize,
  type Participant,
  type Registration,
  type RegisterPayload,
} from "@/lib/types";

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
  participants: unknown;
}): { ok: true; value: RegisterPayload } | { ok: false; error: string } {
  const contact_name = typeof body.contact_name === "string" ? body.contact_name.trim() : "";
  const contact_email = typeof body.contact_email === "string" ? body.contact_email.trim() : "";
  const contact_phone = typeof body.contact_phone === "string" ? body.contact_phone.trim() : "";

  if (!contact_name) return { ok: false, error: "Contact name is required." };
  if (!EMAIL_RE.test(contact_email)) return { ok: false, error: "Contact email is invalid." };
  if (!contact_phone) return { ok: false, error: "Contact phone number is required." };

  if (!Array.isArray(body.participants) || body.participants.length === 0) {
    return { ok: false, error: "At least 1 participant is required." };
  }
  if (body.participants.length > 20) {
    return { ok: false, error: "Maximum 20 participants per registration." };
  }

  const participants: RegisterPayload["participants"] = [];
  for (const [i, raw] of body.participants.entries()) {
    if (typeof raw !== "object" || raw === null) {
      return { ok: false, error: `Participant ${i + 1}'s data is invalid.` };
    }
    const p = raw as Record<string, unknown>;
    const full_name = typeof p.full_name === "string" ? p.full_name.trim() : "";
    const gender = p.gender;
    const category = p.category;
    const jersey_size = p.jersey_size;

    if (!full_name) return { ok: false, error: `Participant ${i + 1}'s name is required.` };
    if (gender !== "L" && gender !== "P") {
      return { ok: false, error: `Participant ${i + 1}'s gender is invalid.` };
    }
    if (typeof category !== "string" || !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      return { ok: false, error: `Participant ${i + 1}'s category is invalid.` };
    }
    if (typeof jersey_size !== "string" || !JERSEY_SIZES.includes(jersey_size as (typeof JERSEY_SIZES)[number])) {
      return { ok: false, error: `Participant ${i + 1}'s jersey size is invalid.` };
    }

    participants.push({
      full_name,
      gender,
      category: category as Category,
      jersey_size: jersey_size as JerseySize,
    });
  }

  return {
    ok: true,
    value: { contact_name, contact_email, contact_phone, participants },
  };
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  let participantsRaw: unknown;
  try {
    participantsRaw = JSON.parse(String(formData.get("participants") ?? "[]"));
  } catch {
    return NextResponse.json({ error: "Invalid participant data." }, { status: 400 });
  }

  const result = validateFields({
    contact_name: formData.get("contact_name"),
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone"),
    participants: participantsRaw,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const { contact_name, contact_email, contact_phone, participants } = result.value;

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

  // total_amount already includes the unique code (see PAYMENT.uniqueCode) —
  // it's the exact figure the registrant was told to transfer, so every page
  // that displays it (success, verify, admin) shows one consistent number.
  const totalAmount = calculateTransferAmount(participants.map((p) => p.category));

  type CreateRegistrationRow = {
    registration_id: string;
    participant_id: string;
    bib_number: number;
    full_name: string;
  };

  const { data, error } = await supabaseServer.rpc("create_registration", {
    p_contact_name: contact_name,
    p_contact_email: contact_email,
    p_contact_phone: contact_phone,
    p_total_amount: totalAmount,
    p_participants: participants,
  });
  const rows = data as CreateRegistrationRow[] | null;

  if (error || !rows || rows.length === 0) {
    console.error("create_registration failed", error);
    return NextResponse.json(
      { error: "Failed to save your registration. Please try again shortly." },
      { status: 500 }
    );
  }

  const registrationId = rows[0].registration_id;
  const proofPath = `${registrationId}/payment-proof.${extension}`;

  const { error: uploadError } = await uploadPaymentProof(proofPath, paymentProof);
  if (uploadError) {
    console.error("uploadPaymentProof failed", uploadError);
    await supabaseServer.from("registrations").delete().eq("id", registrationId);
    return NextResponse.json(
      { error: "Failed to upload payment proof. Please try again." },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabaseServer
    .from("registrations")
    .update({ payment_proof_path: proofPath })
    .eq("id", registrationId);
  if (updateError) {
    console.error("update payment_proof_path failed", updateError);
    await supabaseServer.from("registrations").delete().eq("id", registrationId);
    return NextResponse.json(
      { error: "Failed to save payment proof. Please try again." },
      { status: 500 }
    );
  }

  const resultParticipants = rows.map((row) => ({
    id: row.participant_id,
    bib_number: row.bib_number,
    full_name: row.full_name,
  }));

  try {
    const { data: fullParticipants } = await supabaseServer
      .from("participants")
      .select("*")
      .eq("registration_id", registrationId)
      .order("bib_number", { ascending: true })
      .returns<Participant[]>();

    const registration: Registration = {
      id: registrationId,
      created_at: new Date().toISOString(),
      contact_name,
      contact_email,
      contact_phone,
      total_amount: totalAmount,
      payment_proof_path: proofPath,
    };

    const pdfBuffer = await generateRegistrationPdf(registration, fullParticipants ?? []);
    const { error: emailError } = await sendRegistrationEmail({
      to: contact_email,
      contactName: contact_name,
      registrationId,
      pdfBuffer,
    });
    if (emailError) {
      console.error("sendRegistrationEmail failed", emailError);
    }
  } catch (err) {
    // The registration itself already succeeded — a PDF/email hiccup shouldn't fail the request.
    console.error("PDF generation or email delivery failed", err);
  }

  return NextResponse.json(
    { id: registrationId, total_amount: totalAmount, participants: resultParticipants },
    { status: 201 }
  );
}
