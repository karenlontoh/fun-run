import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import ExcelJS from "exceljs";
import { VERIFY_AUTH_COOKIE, getVerifyRole } from "@/lib/verify-auth";
import { supabaseServer } from "@/lib/supabase-server";
import type { CharityParticipant, CharityRegistration } from "@/lib/types";

const GENDER_LABEL: Record<string, string> = { L: "Male", P: "Female" };

export async function GET() {
  const cookieStore = await cookies();
  const role = await getVerifyRole(cookieStore.get(VERIFY_AUTH_COOKIE)?.value);
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: registrations } = await supabaseServer
    .from("charity_registrations")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<CharityRegistration[]>();

  const { data: participants } = await supabaseServer
    .from("charity_participants")
    .select("*")
    .returns<CharityParticipant[]>();

  const participantsByRegistration = new Map<string, CharityParticipant[]>();
  for (const p of participants ?? []) {
    const list = participantsByRegistration.get(p.registration_id) ?? [];
    list.push(p);
    participantsByRegistration.set(p.registration_id, list);
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Fun Walk Registrations");

  sheet.columns = [
    { header: "Registered At", key: "registered_at", width: 20 },
    { header: "Payment Status", key: "payment_status", width: 16 },
    { header: "Payment Method", key: "payment_method", width: 16 },
    { header: "Contact Name", key: "contact_name", width: 22 },
    { header: "Contact Email", key: "contact_email", width: 26 },
    { header: "Contact Phone", key: "contact_phone", width: 16 },
    { header: "Total Amount (IDR)", key: "total_amount", width: 18 },
    { header: "Participant Name", key: "participant_name", width: 22 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Institution", key: "institution", width: 26 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const registration of registrations ?? []) {
    const groupParticipants = participantsByRegistration.get(registration.id) ?? [];
    if (groupParticipants.length === 0) {
      sheet.addRow({
        registered_at: new Date(registration.created_at).toLocaleString("en-GB"),
        payment_status: registration.payment_status,
        payment_method: registration.payment_method ?? "",
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
        payment_method: registration.payment_method ?? "",
        contact_name: registration.contact_name,
        contact_email: registration.contact_email,
        contact_phone: registration.contact_phone,
        total_amount: registration.total_amount,
        participant_name: participant.full_name,
        gender: GENDER_LABEL[participant.gender] ?? participant.gender,
        institution: participant.institution,
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="paulus-fun-walk-registrations-${date}.xlsx"`,
    },
  });
}
