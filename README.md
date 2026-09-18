# 🏔️ TNBTS Digital - Sistem Tiket & Tata Kelola Kuota Resmi Bromo Tengger Semeru

Sistem platform pemesanan tiket resmi kawasan konservasi **Taman Nasional Bromo Tengger Semeru (TNBTS)** generasi 2026. Dirancang khusus untuk memutus rantai percaloan (*anti-scalper*), mencegah manipulasi kuota (*concurrency locking*), mematikan peredaran screenshot tiket ilegal (*dynamic rolling QR*), dan menyederhanakan alur kunjungan bagi masyarakat luas.

Dibangun menggunakan teknologi modern **100% JavaScript (Fullstack Next.js 16 + Node.js + SQLite WAL Mode + Tailwind CSS)**.

---

## 🚀 Fitur Unggulan Sistem (Anti-Calo & Anti-Manipulasi)

1. **Kunci Kuota 15 Menit (*Anti-Hoarding Engine*):**
   * Menghilangkan celah calo menahan tiket berjam-jam tanpa modal.
   * Kuota hanya dikunci 15 menit. Jika tidak lunas dalam batas waktu, *sweeper* otomatis mengembalikan kuota ke pool publik secara *real-time*.
2. **Aturan 1 NIK = 1 Tiket Terikat Permanen:**
   * NIK/Paspor divalidasi dan dikunci permanen sejak pembayaran.
   * Menghilangkan praktik calo memesan nama fiktif lalu diganti nama menjelang keberangkatan.
3. **Dynamic Time-Rolling QR Code (45 Detik):**
   * Tiket digital menggunakan token HMAC-SHA256 berotasi setiap **45 detik**.
   * Tangkapan layar (*screenshot*) yang dijual calo di WhatsApp/medsos otomatis **INVALID / KEDALUWARSA** saat tiba di pintu masuk.
4. **Proteksi Concurrency Transaksional (ACID):**
   * Menggunakan transaksi database berkecepatan tinggi dengan *pessimistic row-locking*.
   * Menjamin **kuota tidak akan pernah minus (*zero overselling*)** meski ribuan pengunjung berebut slot di milidetik yang sama.
5. **Pemeriksaan Cepat Pos Gerbang (*Mobile Ranger Scanner*):**
   * Antarmuka scanner mobile berkecepatan tinggi dengan feedback audio *beep* dan visual **HIJAU (VALID)** atau **MERAH (INVALID)**.
   * Dilengkapi deteksi *double-scan* untuk mencegah duplikasi tiket.

---

## 👥 3 Role Operasional Terpadu

Sistem disederhanakan mengikuti kebutuhan riil lapangan Balai Besar TNBTS:

| Role | Akses Utama | Fungsi & Fitur |
| :--- | :--- | :--- |
| 🌲 **Wisatawan / Pengunjung** | `/` (Portal Utama) | Cek sisa kuota, persetujuan SOP resmi, booking tiket, bayar QRIS/VA instan, dan melihat E-Ticket dinamis di HP. |
| 🛡️ **Petugas Pos Gerbang** | `/scanner` | Pemindaian barcode tiket di pintu masuk (*Cemoro Lawang, Wonokitri, Coban Trisula, Senduro*) dengan deteksi instan. |
| 📊 **Pengelola Balai TNBTS** | `/admin` | Monitoring kuota 6 destinasi, rekap PNBP kas negara, tombol kendali darurat status kawasan (Buka/Tutup/Terbatas), dan deteksi anomali bot. |

---

## 🛠️ Stack Teknologi

* **Frontend & Backend API:** [Next.js 16 (Turbopack, App Router)](https://nextjs.org/) + React 19
* **Database & Concurrency:** SQLite via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) dengan WAL (*Write-Ahead Logging*) Mode
* **Styling & UI:** [Tailwind CSS v4](https://tailwindcss.com/) + Glassmorphism + Google Fonts (Plus Jakarta Sans)
* **Kriptografi Tiket:** Node.js Crypto (HMAC-SHA256) Time-Step Token + `qrcode`
* **Keamanan Akun:** JWT (`jsonwebtoken`) + Bcrypt (`bcryptjs`)

---

## 📦 Panduan Instalasi & Menjalankan Lokal

### 1. Kloning Repositori
```bash
git clone https://github.com/rezkyaditya21/TNBTS-TIKET.git
cd TNBTS-TIKET
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Inisialisasi Database & Seeding Data Master
```bash
node scripts/seed.js
```

### 4. Jalankan Uji Coba Layanan (Unit / Integration Tests)
```bash
node scripts/test-services.js
```

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di **[http://localhost:3000](http://localhost:3000)**.

---

## 🔑 Akun Uji Coba Bawaan (Password: `Bromo2026!`)

Tersedia tombol **Role Quick-Switcher** di pojok kanan atas navigasi untuk berganti akun secara instan:

* **Wisatawan:** `wisatawan@gmail.com`
* **Petugas Gerbang:** `petugas@tnbts.go.id`
* **Admin Balai TNBTS:** `admin@tnbts.go.id`

---

## 🗺️ Situs Destinasi & Kapasitas Bawaan

1. **Site Penanjakan 1** (Sunrise Spot Utama - Kapasitas 800 orang/hari)
2. **Site Bukit Cinta / Love Hill** (Sunrise Spot - Kapasitas 400 orang/hari)
3. **Site Bukit Kedaluh / Kingkong Hill** (Sunrise Spot - Kapasitas 600 orang/hari)
4. **Site Mentigen Cemoro Lawang** (Sunrise Spot - Kapasitas 400 orang/hari)
5. **Site Laut Pasir & Kawah Bromo** (Eksplorasi Kaldera - Kapasitas 1.200 orang/hari)
6. **Kawasan Ranu Kumbolo & Ranupani** (Jalur Konservasi Semeru - Kapasitas 300 orang/hari)

---

## 📄 Lisensi
Hak Cipta © 2026 Balai Besar Taman Nasional Bromo Tengger Semeru. Seluruh hak cipta dilindungi undang-undang.
