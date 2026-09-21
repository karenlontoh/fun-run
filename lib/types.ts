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
export const JERSEY_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type JerseySize = (typeof JERSEY_SIZES)[number];

export const JERSEY_SIZES_CHILD = ["S", "M", "L", "XL"] as const;
export type ChildJerseySize = (typeof JERSEY_SIZES_CHILD)[number];

export function jerseySizesFor(ageGroup: AgeGroup): readonly string[] {
  return ageGroup === "anak" ? JERSEY_SIZES_CHILD : JERSEY_SIZES;
}

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
  payment_method: PaymentMethod;
};

export type RegistrationWithParticipants = Registration & {
  participants: Participant[];
};
