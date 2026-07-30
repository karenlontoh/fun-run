import "server-only";
import { Resend } from "resend";
import { EVENT } from "./event-config";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendRegistrationEmail(params: {
  to: string;
  contactName: string;
  registrationId: string;
  pdfBuffer: Buffer;
}): Promise<{ error: string | null }> {
  if (!resend) {
    return { error: "RESEND_API_KEY is not configured" };
  }

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Paulus Fun Run <onboarding@resend.dev>",
    to: params.to,
    subject: `${EVENT.name} — Your Registration & QR Codes`,
    text: `Hi ${params.contactName},\n\nThanks for registering for ${EVENT.name}! Your registration confirmation, group QR code, and each participant's personal QR code are attached as a PDF.\n\nRegistration ID: ${params.registrationId}\n\nSee you on race day!\n${EVENT.church}`,
    attachments: [
      {
        filename: `paulus-fun-run-${params.registrationId}.pdf`,
        content: params.pdfBuffer,
      },
    ],
  });

  return { error: error?.message ?? null };
}
