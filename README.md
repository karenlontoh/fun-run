# Paulus Fun Run 2026

Landing page + sistem pendaftaran untuk Paulus Fun Run (GPIB Paulus Jakarta), dibuat dengan
Next.js + Supabase karena paket WordPress.com yang dipakai (`gpibpaulusjakarta.org/funrun`) tidak
mendukung upload plugin custom. Aplikasi ini di-deploy terpisah lalu di-embed ke halaman WordPress
lewat iframe.

## Fitur

- **Landing page** (`/`) — info acara, kategori lomba, cara daftar, FAQ.
- **Form pendaftaran** (`/daftar`) — 1 kontak bisa mendaftarkan banyak peserta sekaligus
  ("+ Tambah Peserta"). Setiap peserta otomatis dapat **nomor BIB** unik.
- **QR code per pendaftaran** — 1 pendaftaran (bisa berisi banyak peserta) = 1 QR code unik.
  Ditampilkan & bisa diunduh di halaman sukses setelah submit.
- **Halaman verifikasi/scan** (`/verify/[id]`) — inilah yang dituju oleh QR code. Saat di-scan
  panitia saat race day, langsung menampilkan daftar peserta & nomor BIB grup tersebut.

## Setup

### 1. Buat project Supabase

1. Buat project baru di [supabase.com](https://supabase.com) (gratis).
2. Buka **SQL Editor**, jalankan seluruh isi file [`supabase/schema.sql`](supabase/schema.sql).
   Ini akan membuat tabel `registrations`, `participants`, sequence nomor BIB, dan fungsi
   `create_registration` yang menyimpan 1 pendaftaran + semua pesertanya secara atomik.
3. Buka **Project Settings > API**, salin:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ jangan pernah expose ke browser,
     hanya dipakai di server — sudah diatur begitu di kode ini)

### 2. Environment variables

```bash
cp .env.example .env.local
```

Isi `.env.local` dengan nilai dari Supabase di atas. `NEXT_PUBLIC_SITE_URL` diisi
`http://localhost:3000` untuk development, dan diganti ke URL production setelah deploy (dipakai
untuk membuat link yang di-encode di dalam QR code).

### 3. Jalankan lokal

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

Detail acara (tanggal, waktu, titik kumpul, kategori, kontak) ada di satu tempat:
[`lib/event-config.ts`](lib/event-config.ts) — edit di situ saja, otomatis kepakai di semua
halaman.

## Struktur data

- `registrations` — 1 baris per submit form (data kontak pendaftar).
- `participants` — 1 baris per peserta, terhubung ke `registrations` lewat `registration_id`.
  Nomor `bib_number` di-generate otomatis & unik lewat sequence Postgres.
- QR code meng-encode URL `/verify/<registration_id>` — halaman itu publik (bisa diakses siapa
  saja yang tahu ID-nya, ID berupa UUID acak jadi tidak bisa ditebak) dan menampilkan semua
  peserta dalam pendaftaran tersebut.
