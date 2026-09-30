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
  registrationClose: "30 September 2026",
  // ISO timestamp (WIB, UTC+7) the countdown on the homepage counts down to.
  registrationCloseAt: "2026-09-30T23:59:59+07:00",
  contactEmail: "funrun@gpibpaulusjakarta.org",
  contactPhone: "0812-3456-7890",
  instagram: "@paulusfunrun",
  // Committee inbox that gets notified whenever a new registration comes in.
  notificationEmail: "paulusfunrun.peg@gmail.com",
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

// Charity Paulus Fun Walk — a separate charity session alongside the main
// run, same event day, no race pack/BIB/medal. Uses the same bank account
// but its own unique code so the committee can tell the two apart on the
// bank statement.
export const CHARITY_WALK = {
  name: "Charity Paulus Fun Walk",
  underOrganization: "Kementerian Agama RI",
  pricePerPerson: 250000,
  uniqueCode: "008",
  // Hard cap on total participants — intentionally not shown on the public
  // page ("limited slots" only), just enforced server-side.
  maxParticipants: 100,
  guest: {
    name: "Gugun Gumilar, M.A., Ph.D",
    title: "Staf Khusus Menteri Agama RI",
    photo: "/fun-walk/gugun-gumilar.png",
  },
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

export const JERSEYS = [
  {
    category: "5K",
    accent: "lime",
    front: "/jerseys/5k-front.webp",
    back: "/jerseys/5k-back.webp",
  },
  {
    category: "2.5K",
    accent: "orange",
    front: "/jerseys/2.5k-front.webp",
    back: "/jerseys/2.5k-back.webp",
  },
] as const;

