import { notFound } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";
import { supabaseServer } from "@/lib/supabase-server";
import { generateQrDataUrl } from "@/lib/qrcode";
import { verifyUrl } from "@/lib/site";
import { getPaymentProofSignedUrl } from "@/lib/storage";
import { formatIDR } from "@/lib/pricing";
import type { Participant, Registration } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RegistrationSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: registration } = await supabaseServer
    .from("registrations")
    .select("*")
    .eq("id", id)
    .single<Registration>();

  if (!registration) {
    notFound();
  }

  const { data: participants } = await supabaseServer
    .from("participants")
    .select("*")
    .eq("registration_id", id)
    .order("bib_number", { ascending: true })
    .returns<Participant[]>();

  const qrDataUrl = await generateQrDataUrl(verifyUrl(id));
  const proofUrl = registration.payment_proof_path
    ? await getPaymentProofSignedUrl(registration.payment_proof_path)
    : null;

  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:py-20">
          <p className="font-display text-sm tracking-[0.3em] text-lime-dark">
            REGISTRATION SUCCESSFUL
          </p>
          <h1 className="font-display mt-2 text-4xl text-navy sm:text-5xl">
            See You on Race Day!
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-navy/70">
            A PDF with your group QR code and a personal QR code for each participant has been
            sent to <span className="font-semibold text-navy">{registration.contact_email}</span>.
            Show the group QR at check-in, or use each participant&apos;s personal QR if your
            group is arriving separately.
          </p>

          <div className="mx-auto mt-10 w-fit rounded-3xl border border-navy/10 bg-white p-8 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Registration QR code" width={240} height={240} className="mx-auto" />
            <p className="mt-4 text-xs text-navy/50">Registration ID: {id}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <a
                href={qrDataUrl}
                download={`paulus-fun-run-${id}.png`}
                className="inline-block rounded-full border-2 border-navy px-6 py-2.5 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
              >
                Download QR Code
              </a>
              <a
                href={`/api/registrations/${id}/pdf`}
                className="inline-block rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-navy-light"
              >
                Download PDF (Group + Personal QR Codes)
              </a>
            </div>
          </div>

          <div className="mt-12 text-left">
            <h2 className="font-display text-2xl text-navy">Registered Participants</h2>
            <div className="mt-4 space-y-3">
              {(participants ?? []).map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-navy/10 bg-white px-5 py-4"
                >
                  <p className="font-semibold text-navy">{p.full_name}</p>
                  <p className="text-sm text-navy/60">
                    {p.category} · {p.gender === "L" ? "Male" : "Female"} · Jersey {p.jersey_size}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-navy/10 bg-white px-6 py-5 text-left">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-navy">Total Payment</p>
              <p className="font-display text-2xl text-orange">{formatIDR(registration.total_amount)}</p>
            </div>
            {proofUrl ? (
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-navy underline decoration-lime decoration-2 underline-offset-4"
              >
                View your uploaded payment proof
              </a>
            ) : (
              <p className="mt-2 text-sm text-navy/60">Payment proof not available.</p>
            )}
            <p className="mt-2 text-xs text-navy/50">
              Our committee will verify your payment before race day.
            </p>
          </div>

          <Link
            href="/"
            className="mt-12 inline-block font-display text-lg tracking-wide text-navy underline decoration-orange decoration-4 underline-offset-4"
          >
            BACK TO HOME
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
