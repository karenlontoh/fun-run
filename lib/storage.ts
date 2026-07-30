import "server-only";
import { supabaseServer } from "./supabase-server";

const PAYMENT_PROOF_BUCKET = "payment-proofs";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export async function uploadPaymentProof(
  path: string,
  file: File
): Promise<{ error: string | null }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabaseServer.storage
    .from(PAYMENT_PROOF_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });
  return { error: error?.message ?? null };
}

export async function getPaymentProofSignedUrl(path: string): Promise<string | null> {
  const { data } = await supabaseServer.storage
    .from(PAYMENT_PROOF_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}
