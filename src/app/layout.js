import "./globals.css";

export const metadata = {
  title: "TNBTS Digital - Portal Resmi Tiket Bromo Tengger Semeru",
  description: "Sistem resmi pemesanan tiket masuk kawasan Taman Nasional Bromo Tengger Semeru. Terintegrasi, transparan, anti-calo dengan verifikasi kuota real-time dan tiket digital dinamis.",
  keywords: ["TNBTS", "Bromo", "Semeru", "Tiket Bromo", "Booking Online Bromo", "Penanjakan", "Ranu Kumbolo"],
};

import ServiceWorkerKiller from "@/components/ServiceWorkerKiller.jsx";

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
        <ServiceWorkerKiller />
        {children}
      </body>
    </html>
  );
}
