import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { uploadPaymentProof } from "@/lib/storage";
import { calculateCharityMinAmount } from "@/lib/pricing";
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

type CharityParticipantInput = { full_name: string; gender: "L" | "P" };

function validateFields(body: {
  contact_name: unknown;
  contact_email: unknown;
  contact_phone: unknown;
  participants: unknown;
}): { ok: true; value: { contact_name: string; contact_email: string; contact_phone: string; participants: CharityParticipantInput[] } } | { ok: false; error: string } {
  const contact_name = typeof body.contact_name === "string" ? body.contact_name.trim() : "";
  const contact_email = typeof body.contact_email === "string" ? body.contact_email.trim() : "";
  const contact_phone = typeof body.contact_phone === "string" ? body.contact_phone.trim() : "";

  if (!contact_name) return { ok: false, error: "Nama kontak wajib diisi." };
  if (!EMAIL_RE.test(contact_email)) return { ok: false, error: "Email kontak tidak valid." };
  if (!contact_phone) return { ok: false, error: "Nomor telepon kontak wajib diisi." };

  if (!Array.isArray(body.participants) || body.participants.length === 0) {
    return { ok: false, error: "Minimal 1 peserta wajib diisi." };
  }
  if (body.participants.length > 50) {
    return { ok: false, error: "Maksimal 50 peserta per pendaftaran." };
  }

  const participants: CharityParticipantInput[] = [];
  for (const [i, raw] of body.participants.entries()) {
    if (typeof raw !== "object" || raw === null) {
      return { ok: false, error: `Data peserta ${i + 1} tidak valid.` };
    }
    const p = raw as Record<string, unknown>;
    const full_name = typeof p.full_name === "string" ? p.full_name.trim() : "";
    const gender = p.gender;
    if (!full_name) return { ok: false, error: `Nama peserta ${i + 1} wajib diisi.` };
    if (gender !== "L" && gender !== "P") {
      return { ok: false, error: `Jenis kelamin peserta ${i + 1} tidak valid.` };
    }
    participants.push({ full_name, gender });
  }

  return { ok: true, value: { contact_name, contact_email, contact_phone, participants } };
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Data permintaan tidak valid." }, { status: 400 });
  }

  let participantsRaw: unknown;
  try {
    participantsRaw = JSON.parse(String(formData.get("participants") ?? "[]"));
  } catch {
    return NextResponse.json({ error: "Data peserta tidak valid." }, { status: 400 });
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

  const { count: currentParticipantCount } = await supabaseServer
    .from("charity_participants")
    .select("id", { count: "exact", head: true });
  if ((currentParticipantCount ?? 0) + participants.length > CHARITY_WALK.maxParticipants) {
    return NextResponse.json(
      { error: "Maaf, Fun Walk charity ini sudah penuh. Pendaftaran sudah ditutup." },
      { status: 409 }
    );
  }

  const paymentProof = formData.get("payment_proof");
  if (!(paymentProof instanceof File) || paymentProof.size === 0) {
    return NextResponse.json({ error: "Bukti pembayaran wajib diunggah." }, { status: 400 });
  }
  if (paymentProof.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Ukuran bukti pembayaran harus di bawah 5MB." }, { status: 400 });
  }
  const extension = ALLOWED_FILE_TYPES[paymentProof.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Bukti pembayaran harus berformat JPG, PNG, WEBP, atau PDF." },
      { status: 400 }
    );
  }

  const totalAmount = calculateCharityMinAmount(participants.length);

  type CreateCharityRow = { registration_id: string; participant_id: string; full_name: string };

  const { data, error } = await supabaseServer.rpc("create_charity_registration", {
    p_contact_name: contact_name,
    p_contact_email: contact_email,
    p_contact_phone: contact_phone,
    p_total_amount: totalAmount,
    p_participants: participants,
  });
  const rows = data as CreateCharityRow[] | null;

  if (error || !rows || rows.length === 0) {
    console.error("create_charity_registration failed", error);
    return NextResponse.json(
      { error: "Gagal menyimpan pendaftaran kamu. Silakan coba lagi sebentar." },
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
      { error: "Gagal mengunggah bukti pembayaran. Silakan coba lagi." },
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
      { error: "Gagal menyimpan bukti pembayaran. Silakan coba lagi." },
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
