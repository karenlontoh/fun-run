import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import ExcelJS from "exceljs";
import { VERIFY_AUTH_COOKIE, isValidVerifyAuthCookie } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";
import type { Participant, Registration } from "@/lib/types";

const GENDER_LABEL: Record<string, string> = { L: "Male", P: "Female" };
const AGE_GROUP_LABEL: Record<string, string> = { anak: "Anak", dewasa: "Dewasa" };

export async function GET() {
  const cookieStore = await cookies();
  const authorized = await isValidVerifyAuthCookie(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: registrations } = await supabaseServer
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Registration[]>();

  const { data: participants } = await supabaseServer
    .from("participants")
    .select("*")
    .returns<Participant[]>();

  const participantsByRegistration = new Map<string, Participant[]>();
  for (const p of participants ?? []) {
    const list = participantsByRegistration.get(p.registration_id) ?? [];
    list.push(p);
    participantsByRegistration.set(p.registration_id, list);
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Registrations");

  sheet.columns = [
    { header: "Registered At", key: "registered_at", width: 20 },
    { header: "Payment Status", key: "payment_status", width: 16 },
    { header: "Payment Method", key: "payment_method", width: 16 },
    { header: "Contact Name", key: "contact_name", width: 22 },
    { header: "Contact Email", key: "contact_email", width: 26 },
    { header: "Contact Phone", key: "contact_phone", width: 16 },
    { header: "Total Amount (IDR)", key: "total_amount", width: 18 },
    { header: "BIB Number", key: "bib_number", width: 12 },
    { header: "Participant Name", key: "participant_name", width: 22 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Age Group", key: "age_group", width: 12 },
    { header: "Category", key: "category", width: 10 },
    { header: "Jersey Size", key: "jersey_size", width: 12 },
    { header: "Checked In", key: "checked_in", width: 12 },
    { header: "Checked In At", key: "checked_in_at", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const registration of registrations ?? []) {
    const groupParticipants = participantsByRegistration.get(registration.id) ?? [];
    if (groupParticipants.length === 0) {
      sheet.addRow({
        registered_at: new Date(registration.created_at).toLocaleString("en-GB"),
        payment_status: registration.payment_status,
        payment_method: registration.payment_method,
        contact_name: registration.contact_name,
        contact_email: registration.contact_email,
        contact_phone: registration.contact_phone,
        total_amount: registration.total_amount,
      });
      continue;
    }
    for (const participant of groupParticipants) {
      sheet.addRow({
        registered_at: new Date(registration.created_at).toLocaleString("en-GB"),
        payment_status: registration.payment_status,
        payment_method: registration.payment_method,
        contact_name: registration.contact_name,
        contact_email: registration.contact_email,
        contact_phone: registration.contact_phone,
        total_amount: registration.total_amount,
        bib_number: participant.bib_number,
        participant_name: participant.full_name,
        gender: GENDER_LABEL[participant.gender] ?? participant.gender,
        age_group: AGE_GROUP_LABEL[participant.age_group] ?? participant.age_group,
        category: participant.category,
        jersey_size: participant.jersey_size,
        checked_in: participant.checked_in ? "Yes" : "No",
        checked_in_at: participant.checked_in_at
          ? new Date(participant.checked_in_at).toLocaleString("en-GB")
          : "",
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="paulus-fun-run-registrations-${date}.xlsx"`,
    },
  });
}
