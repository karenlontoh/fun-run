export type Gender = "L" | "P";

export const PAYMENT_STATUSES = ["pending", "verified", "unverified"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CATEGORIES = ["2.5K", "5K"] as const;
export type Category = (typeof CATEGORIES)[number];

export const AGE_GROUPS = ["anak", "dewasa"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

// Adults have the full range; kids ('anak') top out at XL. Jersey size isn't
// DB-constrained to either list, so this only shapes the form UI.
export const JERSEY_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;
export type JerseySize = (typeof JERSEY_SIZES)[number];

export const JERSEY_SIZES_CHILD = ["S", "M", "L", "XL"] as const;
export type ChildJerseySize = (typeof JERSEY_SIZES_CHILD)[number];

export function jerseySizesFor(ageGroup: AgeGroup): readonly string[] {
  return ageGroup === "anak" ? JERSEY_SIZES_CHILD : JERSEY_SIZES;
}

// Adult ("dewasa") jersey measurements in cm, ±1–2cm tolerance.
export const ADULT_SIZE_CHART: { size: string; length: number; width: number; sleeve: number }[] = [
  { size: "S", length: 66, width: 45, sleeve: 20 },
  { size: "M", length: 69, width: 48, sleeve: 21 },
  { size: "L", length: 72, width: 51, sleeve: 22 },
  { size: "XL", length: 75, width: 54, sleeve: 23 },
  { size: "XXL", length: 78, width: 57, sleeve: 24 },
  { size: "XXXL", length: 81, width: 60, sleeve: 25 },
];

// Kids ("anak") jersey measurements in cm — no sleeve measurement given for this range.
export const CHILD_SIZE_CHART: { size: string; length: number; width: number }[] = [
  { size: "S", length: 54, width: 40 },
  { size: "M", length: 57, width: 43 },
  { size: "L", length: 60, width: 46 },
  { size: "XL", length: 63, width: 49 },
];

export type ParticipantInput = {
  full_name: string;
  gender: Gender;
  category: Category;
  jersey_size: JerseySize;
  // Omitted by the public registration form, which doesn't collect this —
  // the create_registration RPC defaults it to 'dewasa' when absent.
  age_group?: AgeGroup;
};

export type RegisterPayload = {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  participants: ParticipantInput[];
};

export type Participant = {
  id: string;
  registration_id: string;
  bib_number: number;
  full_name: string;
  gender: Gender;
  category: string;
  jersey_size: string;
  checked_in: boolean;
  checked_in_at: string | null;
  age_group: AgeGroup;
};

export type Registration = {
  id: string;
  created_at: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  total_amount: number;
  payment_proof_path: string | null;
  payment_status: PaymentStatus;
  // null until a payment has actually happened (e.g. a manually-entered
  // registration still marked "belum bayar").
  payment_method: PaymentMethod | null;
};

export type RegistrationWithParticipants = Registration & {
  participants: Participant[];
};
