export type Gender = "L" | "P";

export const CATEGORIES = ["2.5K", "5K"] as const;
export type Category = (typeof CATEGORIES)[number];

export const JERSEY_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type JerseySize = (typeof JERSEY_SIZES)[number];

export type ParticipantInput = {
  full_name: string;
  gender: Gender;
  category: Category;
  jersey_size: JerseySize;
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
};

export type Registration = {
  id: string;
  created_at: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  total_amount: number;
  payment_proof_path: string | null;
};

export type RegistrationWithParticipants = Registration & {
  participants: Participant[];
};
