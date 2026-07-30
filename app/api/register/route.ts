import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { CATEGORIES, JERSEY_SIZES, type Category, type JerseySize, type RegisterPayload } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(body: unknown): { ok: true; value: RegisterPayload } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Payload tidak valid." };
  }
  const b = body as Record<string, unknown>;

  const contact_name = typeof b.contact_name === "string" ? b.contact_name.trim() : "";
  const contact_email = typeof b.contact_email === "string" ? b.contact_email.trim() : "";
  const contact_phone = typeof b.contact_phone === "string" ? b.contact_phone.trim() : "";

  if (!contact_name) return { ok: false, error: "Nama kontak wajib diisi." };
  if (!EMAIL_RE.test(contact_email)) return { ok: false, error: "Email kontak tidak valid." };
  if (!contact_phone) return { ok: false, error: "Nomor telepon kontak wajib diisi." };

  if (!Array.isArray(b.participants) || b.participants.length === 0) {
    return { ok: false, error: "Minimal harus ada 1 peserta." };
  }
  if (b.participants.length > 20) {
    return { ok: false, error: "Maksimal 20 peserta per pendaftaran." };
  }

  const participants: RegisterPayload["participants"] = [];
  for (const [i, raw] of b.participants.entries()) {
    if (typeof raw !== "object" || raw === null) {
      return { ok: false, error: `Data peserta ke-${i + 1} tidak valid.` };
    }
    const p = raw as Record<string, unknown>;
    const full_name = typeof p.full_name === "string" ? p.full_name.trim() : "";
    const gender = p.gender;
    const category = p.category;
    const jersey_size = p.jersey_size;

    if (!full_name) return { ok: false, error: `Nama peserta ke-${i + 1} wajib diisi.` };
    if (gender !== "L" && gender !== "P") {
      return { ok: false, error: `Jenis kelamin peserta ke-${i + 1} tidak valid.` };
    }
    if (typeof category !== "string" || !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      return { ok: false, error: `Kategori peserta ke-${i + 1} tidak valid.` };
    }
    if (typeof jersey_size !== "string" || !JERSEY_SIZES.includes(jersey_size as (typeof JERSEY_SIZES)[number])) {
      return { ok: false, error: `Ukuran jersey peserta ke-${i + 1} tidak valid.` };
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload bukan JSON yang valid." }, { status: 400 });
  }

  const result = validate(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const { contact_name, contact_email, contact_phone, participants } = result.value;

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
    p_participants: participants,
  });
  const rows = data as CreateRegistrationRow[] | null;

  if (error || !rows || rows.length === 0) {
    console.error("create_registration failed", error);
    return NextResponse.json(
      { error: "Gagal menyimpan pendaftaran. Coba lagi beberapa saat lagi." },
      { status: 500 }
    );
  }

  const registrationId = rows[0].registration_id;
  const resultParticipants = rows.map((row) => ({
    id: row.participant_id,
    bib_number: row.bib_number,
    full_name: row.full_name,
  }));

  return NextResponse.json(
    { id: registrationId, participants: resultParticipants },
    { status: 201 }
  );
}
