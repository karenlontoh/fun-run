import "server-only";
import { supabaseServer } from "./supabase-server";

const PAYMENT_PROOF_BUCKET = "payment-proofs";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour
const RACE_PHOTO_BUCKET = "race-photos";

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

export async function deletePaymentProof(path: string): Promise<{ error: string | null }> {
  const { error } = await supabaseServer.storage.from(PAYMENT_PROOF_BUCKET).remove([path]);
  return { error: error?.message ?? null };
}

export async function getPaymentProofSignedUrl(path: string): Promise<string | null> {
  const { data } = await supabaseServer.storage
    .from(PAYMENT_PROOF_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}

export async function uploadRacePhoto(
  path: string,
  bytes: Buffer,
  contentType: string
): Promise<{ error: string | null }> {
  const { error } = await supabaseServer.storage
    .from(RACE_PHOTO_BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  return { error: error?.message ?? null };
}

export async function deleteRacePhoto(path: string): Promise<{ error: string | null }> {
  const { error } = await supabaseServer.storage.from(RACE_PHOTO_BUCKET).remove([path]);
  return { error: error?.message ?? null };
}

// race-photos is a public bucket, so this is just a URL — no signing/network
// call needed, unlike the private payment-proofs bucket above.
export function getRacePhotoPublicUrl(path: string): string {
  const { data } = supabaseServer.storage.from(RACE_PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
