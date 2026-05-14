import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/Toaster';

export const metadata: Metadata = {
  title: 'Háztartás Menedzser — Személyes Pénzügyi Kezelő',
  description: 'Személyes pénzügyi menedzsment: kifizetések, megtakarítások, Little Loom cashflow, rezsi és közműórák egy helyen.',
  keywords: 'pénzügyi kezelő, megtakarítások, rezsi, kifizetések, Little Loom',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
