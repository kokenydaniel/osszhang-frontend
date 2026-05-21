import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/Toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { APP_DESCRIPTION, APP_META_TITLE } from '@/lib/branding';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: APP_META_TITLE,
  description: APP_DESCRIPTION,
  keywords: 'családi pénzügyek, költségvetés, megtakarítások, rezsi, tartozások, háztartás',
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
