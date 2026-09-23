import "server-only";
import { Resend } from "resend";
import { EVENT } from "./event-config";
import { formatIDR } from "./pricing";
import { verifyUrl } from "./site";
import type { Participant, Registration } from "./types";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PAYMENT_STATUS_LABEL: Record<Registration["payment_status"], string> = {
  pending: "Pending",
  verified: "Verified",
  unverified: "Unverified",
};

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

export function buildAdminNotificationEmailHtml(
  registration: Registration,
  participants: Participant[]
): string {
  const rows = participants
    .map(
      (p) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${p.bib_number}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${escapeHtml(p.full_name)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${p.gender === "L" ? "Male" : "Female"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${escapeHtml(p.category)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${p.age_group === "anak" ? "Anak" : "Dewasa"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e5e5;">${escapeHtml(p.jersey_size)}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#111;">
      <h2 style="color:#0a1f5c;margin-bottom:4px;">New Registration — ${EVENT.name}</h2>
      <p style="color:#555;margin-top:0;">A new registration just came in.</p>

      <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;">
        <tr><td style="padding:4px 10px 4px 0;font-weight:bold;width:150px;">Contact Name</td><td style="padding:4px 0;">${escapeHtml(registration.contact_name)}</td></tr>
        <tr><td style="padding:4px 10px 4px 0;font-weight:bold;">Email</td><td style="padding:4px 0;">${escapeHtml(registration.contact_email)}</td></tr>
        <tr><td style="padding:4px 10px 4px 0;font-weight:bold;">Phone</td><td style="padding:4px 0;">${escapeHtml(registration.contact_phone)}</td></tr>
        <tr><td style="padding:4px 10px 4px 0;font-weight:bold;">Total Amount</td><td style="padding:4px 0;">${formatIDR(registration.total_amount)}</td></tr>
        <tr><td style="padding:4px 10px 4px 0;font-weight:bold;">Payment Status</td><td style="padding:4px 0;">${PAYMENT_STATUS_LABEL[registration.payment_status]}</td></tr>
        <tr><td style="padding:4px 10px 4px 0;font-weight:bold;">Payment Method</td><td style="padding:4px 0;">${registration.payment_method ? escapeHtml(registration.payment_method) : "—"}</td></tr>
      </table>

      <h3 style="color:#0a1f5c;margin-top:24px;margin-bottom:8px;">Participants (${participants.length})</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f2f2f2;text-align:left;">
            <th style="padding:6px 10px;">BIB</th>
            <th style="padding:6px 10px;">Name</th>
            <th style="padding:6px 10px;">Gender</th>
            <th style="padding:6px 10px;">Category</th>
            <th style="padding:6px 10px;">Age Group</th>
            <th style="padding:6px 10px;">Jersey</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p style="margin-top:28px;">
        <a href="${verifyUrl(registration.id)}" style="background:#f4602a;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block;">
          View in Admin Dashboard
        </a>
      </p>
    </div>
  `;
}

export async function sendAdminNotificationEmail(params: {
  registration: Registration;
  participants: Participant[];
}): Promise<{ error: string | null }> {
  if (!resend) {
    return { error: "RESEND_API_KEY is not configured" };
  }

  const { registration, participants } = params;
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Paulus Fun Run <onboarding@resend.dev>",
    to: EVENT.notificationEmail,
    subject: `New Registration — ${registration.contact_name} (${participants.length} participant${participants.length === 1 ? "" : "s"})`,
    html: buildAdminNotificationEmailHtml(registration, participants),
  });

  return { error: error?.message ?? null };
}
