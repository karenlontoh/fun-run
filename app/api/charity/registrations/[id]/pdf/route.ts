import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { generateCharityRegistrationPdf } from "@/lib/pdf";
import type { CharityParticipant, CharityRegistration } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: registration } = await supabaseServer
    .from("charity_registrations")
    .select("*")
    .eq("id", id)
    .single<CharityRegistration>();

  if (!registration) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }

  const { data: participants } = await supabaseServer
    .from("charity_participants")
    .select("*")
    .eq("registration_id", id)
    .returns<CharityParticipant[]>();

  const pdfBuffer = await generateCharityRegistrationPdf(registration, participants ?? []);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="paulus-interfaith-fun-walk-${id}.pdf"`,
    },
  });
}
