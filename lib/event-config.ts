// Edit event details here — used across the landing page, form, and emails.
export const EVENT = {
  name: "Paulus Fun Run 2026",
  church: "GPIB Paulus Jakarta",
  date: "Sabtu, 28 Februari 2026",
  time: "05.30 WIB — Selesai",
  meetingPoint: "Halaman GPIB Paulus, Jl. Garut No. 21, Jakarta Pusat",
  registrationDeadline: "31 Januari 2026",
  contactEmail: "funrun@gpibpaulusjakarta.org",
  contactPhone: "0812-3456-7890",
  instagram: "@gpibpaulusjakarta",
} as const;

export const CATEGORY_INFO = [
  {
    code: "5K",
    label: "5K — Fun Run",
    description: "Jarak ramah untuk keluarga dan pemula, rute keliling area sekitar gereja.",
  },
  {
    code: "10K",
    label: "10K — Community Run",
    description: "Untuk peserta yang mau tantangan lebih, rute lebih jauh dengan water station.",
  },
] as const;
