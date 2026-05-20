import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/Toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'PénzPilot | Háztartás Menedzser',
  description: 'Személyes pénzügyi menedzsment: kifizetések, megtakarítások, Little Loom cashflow, rezsi és közműórák egy helyen.',
  keywords: 'pénzügyi kezelő, megtakarítások, rezsi, kifizetések, Little Loom',
};

export const viewport: import('next').Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" className={cn(GeistSans.variable, GeistMono.variable)}>
      <body className="bg-background text-foreground antialiased font-sans">
        <TooltipProvider delayDuration={200}>
          <Toaster />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
