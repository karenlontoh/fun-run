import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERIFY_AUTH_COOKIE, isValidVerifyAuthCookie } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";
import { calculateTransferAmount } from "@/lib/pricing";
import { generateRegistrationPdf } from "@/lib/pdf";
import { sendRegistrationEmail } from "@/lib/email";
import {
  AGE_GROUPS,
  CATEGORIES,
  JERSEY_SIZES,
  JERSEY_SIZES_CHILD,
  PAYMENT_METHODS,
  type AgeGroup,
  type Category,
  type JerseySize,
  type Participant,
  type PaymentMethod,
  type Registration,
} from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALL_JERSEY_SIZES = new Set<string>([...JERSEY_SIZES, ...JERSEY_SIZES_CHILD]);

type ValidatedParticipant = {
  full_name: string;
  gender: "L" | "P";
  category: Category;
  jersey_size: JerseySize;
  age_group: AgeGroup;
};

type ValidatedBody = {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  paid: boolean;
  payment_method: PaymentMethod;
  participants: ValidatedParticipant[];
};

function validateBody(body: Record<string, unknown>): { ok: true; value: ValidatedBody } | { ok: false; error: string } {
  const contact_name = typeof body.contact_name === "string" ? body.contact_name.trim() : "";
  const contact_email = typeof body.contact_email === "string" ? body.contact_email.trim() : "";
  const contact_phone = typeof body.contact_phone === "string" ? body.contact_phone.trim() : "";

  if (!contact_name) return { ok: false, error: "Contact name is required." };
  if (!EMAIL_RE.test(contact_email)) return { ok: false, error: "Contact email is invalid." };
  if (!contact_phone) return { ok: false, error: "Contact phone number is required." };

  if (typeof body.paid !== "boolean") {
    return { ok: false, error: "Missing or invalid 'paid' field." };
  }
  if (!PAYMENT_METHODS.includes(body.payment_method as PaymentMethod)) {
    return { ok: false, error: "Missing or invalid 'payment_method' field." };
  }

  if (!Array.isArray(body.participants) || body.participants.length === 0) {
    return { ok: false, error: "At least 1 participant is required." };
  }
  if (body.participants.length > 50) {
    return { ok: false, error: "Maximum 50 participants per registration." };
  }

  const participants: ValidatedParticipant[] = [];
  for (const [i, raw] of body.participants.entries()) {
    if (typeof raw !== "object" || raw === null) {
      return { ok: false, error: `Participant ${i + 1}'s data is invalid.` };
    }
    const p = raw as Record<string, unknown>;
    const full_name = typeof p.full_name === "string" ? p.full_name.trim() : "";
    const gender = p.gender;
    const category = p.category;
    const jersey_size = p.jersey_size;
    const age_group = p.age_group;

    if (!full_name) return { ok: false, error: `Participant ${i + 1}'s name is required.` };
    if (gender !== "L" && gender !== "P") {
      return { ok: false, error: `Participant ${i + 1}'s gender is invalid.` };
    }
    if (typeof category !== "string" || !CATEGORIES.includes(category as Category)) {
      return { ok: false, error: `Participant ${i + 1}'s category is invalid.` };
    }
    if (typeof jersey_size !== "string" || !ALL_JERSEY_SIZES.has(jersey_size)) {
      return { ok: false, error: `Participant ${i + 1}'s jersey size is invalid.` };
    }
    if (typeof age_group !== "string" || !AGE_GROUPS.includes(age_group as AgeGroup)) {
      return { ok: false, error: `Participant ${i + 1}'s age group is invalid.` };
    }

    participants.push({
      full_name,
      gender,
      category: category as Category,
      jersey_size: jersey_size as JerseySize,
      age_group: age_group as AgeGroup,
    });
  }

  return {
    ok: true,
    value: {
      contact_name,
      contact_email,
      contact_phone,
      paid: body.paid,
      payment_method: body.payment_method as PaymentMethod,
      participants,
    },
  };
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const authorized = await isValidVerifyAuthCookie(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const result = validateBody(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const { contact_name, contact_email, contact_phone, paid, payment_method, participants } = result.value;

  const totalAmount = calculateTransferAmount(participants.map((p) => p.category));
  const paymentStatus = paid ? "verified" : "pending";

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
    p_payment_status: paymentStatus,
    p_payment_method: payment_method,
  });
  const rows = data as CreateRegistrationRow[] | null;

  if (error || !rows || rows.length === 0) {
    console.error("admin create_registration failed", error);
    return NextResponse.json({ error: "Failed to save the registration. Please try again." }, { status: 500 });
  }

  const registrationId = rows[0].registration_id;

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
      payment_proof_path: null,
      payment_status: paymentStatus,
      payment_method,
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
    console.error("PDF generation or email delivery failed", err);
  }

  return NextResponse.json({ id: registrationId }, { status: 201 });
}
