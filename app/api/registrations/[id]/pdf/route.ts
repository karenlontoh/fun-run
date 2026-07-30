import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { generateRegistrationPdf } from "@/lib/pdf";
import type { Participant, Registration } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: registration } = await supabaseServer
    .from("registrations")
    .select("*")
    .eq("id", id)
    .single<Registration>();

  if (!registration) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }

  const { data: participants } = await supabaseServer
    .from("participants")
    .select("*")
    .eq("registration_id", id)
    .order("bib_number", { ascending: true })
    .returns<Participant[]>();

  const pdfBuffer = await generateRegistrationPdf(registration, participants ?? []);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="paulus-fun-run-${id}.pdf"`,
    },
  });
}
