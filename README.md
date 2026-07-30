# Paulus Fun Run 2026

Landing page + sistem pendaftaran untuk Paulus Fun Run (GPIB Paulus Jakarta), dibuat dengan
Next.js + Supabase karena paket WordPress.com yang dipakai (`gpibpaulusjakarta.org/funrun`) tidak
mendukung upload plugin custom. Aplikasi ini di-deploy terpisah lalu di-embed ke halaman WordPress
lewat iframe.

## Fitur

- **Landing page** (`/`) — info acara, kategori lomba, FAQ.
- **Form pendaftaran** (`/daftar`) — 1 kontak bisa mendaftarkan banyak peserta sekaligus
  ("+ Add Participant"). Total pembayaran terhitung otomatis per kategori, lengkap dengan
  instruksi transfer + kode unik, dan upload bukti pembayaran (tersimpan di Supabase Storage).
- **2 jenis QR code per pendaftaran**:
  - **Group QR** — mewakili seluruh pendaftaran. Kalau di-scan, semua peserta dalam grup itu
    langsung muncul.
  - **Personal QR** — 1 per peserta. Berguna kalau anggota grup check-in terpisah; scan
    personal QR hanya menampilkan data peserta itu saja.
- **PDF otomatis dikirim ke email pendaftar** (via [Resend](https://resend.com)) — halaman
  pertama berisi info pendaftaran + Group QR, halaman berikutnya 1 per peserta berisi Personal QR
  masing-masing. PDF yang sama juga bisa diunduh langsung dari halaman sukses.
- **Nomor BIB tidak ditampilkan ke pendaftar** (tidak di web, tidak di PDF/email) — BIB baru
  muncul saat panitia scan QR di halaman `/verify/[id]` pada race day.
- **Halaman `/verify/[id]` dikunci passcode** — cuma panitia yang tahu kode aksesnya yang bisa
  lihat isinya (nama, BIB, dll), termasuk kalau pesertanya sendiri iseng scan/buka QR-nya.
- **Tombol "Collect Race Pack"** di halaman verify — panitia tap sekali per peserta saat
  serah-terima race pack, otomatis tersimpan waktu & statusnya di database.

## Setup

### 1. Buat project Supabase

1. Buat project baru di [supabase.com](https://supabase.com) (gratis).
2. Buka **SQL Editor**, jalankan seluruh isi file [`supabase/schema.sql`](supabase/schema.sql).
   Ini otomatis membuat tabel `registrations` & `participants`, sequence nomor BIB, bucket storage
   privat `payment-proofs`, dan fungsi `create_registration` yang menyimpan 1 pendaftaran + semua
   pesertanya secara atomik.
3. Buka **Project Settings > API**, salin:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ jangan pernah expose ke browser,
     hanya dipakai di server — sudah diatur begitu di kode ini)

### 2. Buat akun Resend (untuk kirim email PDF)

1. Daftar di [resend.com](https://resend.com) (gratis sampai 3.000 email/bulan).
2. Buka **API Keys**, buat key baru → salin ke `RESEND_API_KEY`.
3. Untuk `EMAIL_FROM`, ada 2 opsi:
   - **Cepat untuk testing**: pakai `onboarding@resend.dev` (default) — tapi ini **cuma bisa
     kirim ke email akun Resend kamu sendiri**, tidak ke sembarang pendaftar.
   - **Untuk production**: verifikasi domain kamu sendiri di menu **Domains** Resend (misalnya
     `gpibpaulusjakarta.org`), lalu pakai `EMAIL_FROM=Paulus Fun Run <funrun@gpibpaulusjakarta.org>`.

Kalau `RESEND_API_KEY` belum diisi, pendaftaran tetap jalan normal — cuma email tidak terkirim
(PDF tetap bisa diunduh manual dari halaman sukses).

### 3. Set passcode untuk panitia

Isi `VERIFY_ACCESS_CODE` di env var dengan kode bebas (misal PIN 6 digit). Ini yang harus
dimasukkan panitia sekali di HP mereka masing-masing (berlaku 12 jam) sebelum bisa scan & lihat
data peserta di `/verify/[id]`. Bagikan kode ini hanya ke panitia, jangan ke publik.

### 4. Environment variables

```bash
cp .env.example .env.local
```

Isi `.env.local` dengan nilai dari Supabase & Resend di atas. `NEXT_PUBLIC_SITE_URL` diisi
`http://localhost:3000` untuk development, dan diganti ke URL production setelah deploy (dipakai
untuk membuat link yang di-encode di dalam QR code).

### 5. Jalankan lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Deploy

1. Push repo ini ke GitHub, lalu import ke [Vercel](https://vercel.com/new).
2. Set environment variables yang sama seperti `.env.local` di dashboard Vercel.
3. Setelah dapat domain (misalnya `paulus-fun-run.vercel.app`), update
   `NEXT_PUBLIC_SITE_URL` di Vercel ke domain tersebut lalu redeploy — supaya QR code
   mengarah ke URL yang benar.

## Embed ke WordPress

Di editor halaman `gpibpaulusjakarta.org/funrun`, tambahkan blok **Custom HTML** berisi:

```html
<iframe
  src="https://paulus-fun-run.vercel.app"
  style="width: 100%; height: 100vh; border: 0;"
  title="Paulus Fun Run 2026"
></iframe>
```

Ganti URL sesuai domain deploy kamu. Kalau mau, halaman `/daftar` juga bisa di-embed terpisah ke
halaman WordPress lain dengan cara yang sama.

## Mengedit konten acara

Detail acara (tanggal, waktu, titik kumpul, kategori, kontak, rekening) ada di satu tempat:
[`lib/event-config.ts`](lib/event-config.ts) — edit di situ saja, otomatis kepakai di semua
halaman.

## Struktur data

- `registrations` — 1 baris per submit form (data kontak, total bayar, path bukti pembayaran).
- `participants` — 1 baris per peserta, terhubung ke `registrations` lewat `registration_id`.
  Nomor `bib_number` di-generate otomatis & unik lewat sequence Postgres, tapi **tidak pernah
  dikirim ke pendaftar** — cuma kebaca lewat `/verify/[id]` (halaman untuk panitia).
- QR code Group meng-encode `/verify/<registration_id>`; QR code Personal meng-encode
  `/verify/<participant_id>`. Halaman `/verify/[id]` otomatis mendeteksi jenis ID-nya (coba cari
  di `registrations` dulu, kalau tidak ketemu coba `participants`) dan menampilkan tampilan yang
  sesuai. Kedua ID berupa UUID acak jadi tidak bisa ditebak.
- `checked_in` / `checked_in_at` di `participants` diisi lewat tombol "Collect Race Pack" di
  halaman verify — dipakai panitia untuk menandai race pack sudah diserahkan.
- Semua halaman `/verify/*` (termasuk API check-in-nya) dilindungi `middleware.ts` — tanpa cookie
  akses yang valid (didapat dari halaman `/verify-login` + `VERIFY_ACCESS_CODE`), request akan
  di-redirect / ditolak.
