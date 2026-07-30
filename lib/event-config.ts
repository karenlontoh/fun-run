// Edit event details here — used across the landing page, form, and emails.
export const EVENT = {
  name: "Paulus Fun Run 2026",
  church: "GPIB Paulus Jakarta",
  tagline: "Faith, Fun, Finish",
  date: "Saturday, 17 October 2026",
  gatesOpen: "5:00 AM (WIB)",
  time: "6:00 AM (WIB) — Finish",
  meetingPoint: "GPIB Paulus Jakarta, Jl. Taman Sunda Kelapa No. 12",
  address: "Jl. Taman Sunda Kelapa No. 12",
  registrationOpen: "9 August 2026",
  registrationClose: "20 September 2026",
  contactEmail: "funrun@gpibpaulusjakarta.org",
  contactPhone: "0812-3456-7890",
  instagram: "@paulusfunrun",
} as const;

// Edit bank transfer details here — shown on the registration form as payment instructions.
// uniqueCode is appended to the last digits of every transfer amount so the
// committee can tell Fun Run payments apart from other transfers into the
// same church account.
export const PAYMENT = {
  bankName: "BCA",
  accountNumber: "2066591988",
  accountHolder: "GPIB PAULUS",
  uniqueCode: "007",
} as const;

export const CATEGORY_INFO = [
  {
    code: "2.5K",
    label: "2.5K — Fun Run",
    price: 175000,
    description: "A relaxed course suited for beginners and families, looping around the church grounds.",
  },
  {
    code: "5K",
    label: "5K — Community Run",
    price: 200000,
    description: "A moderate distance for those seeking a bit more challenge, with a water station along the route.",
  },
] as const;

export const BENEFITS = [
  {
    icon: "👕",
    title: "Race Pack",
    description: "An exclusive jersey and your own BIB number — yours to keep after the finish line.",
  },
  {
    icon: "🥤",
    title: "Refreshment",
    description: "Water, snacks, and drinks waiting for you, no matter how long you take to get there.",
  },
  {
    icon: "🏅",
    title: "Medal",
    description: "Cross the finish line at any pace and a medal is yours. Walking counts too.",
  },
  {
    icon: "🎉",
    title: "Entertainment",
    description: "Music, games, and good vibes all morning — hang around after you're done.",
  },
] as const;

// Repeated in the scrolling marquee banner on the landing page.
export const TICKER_TEXT = "PAULUS FUN RUN · 2.5K · 5K · GPIB PAULUS JAKARTA · 17 OCTOBER 2026";
