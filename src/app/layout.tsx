import type { Metadata } from 'next';
import './globals.css';
import { ConditionalToaster } from '@/components/layout/conditional-toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { APP_DESCRIPTION, APP_META_TITLE } from '@/config/branding';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import classNames from 'classnames';
import {AuthProvider} from "@/components/auth/AuthProvider";

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
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" className={classNames(GeistSans.variable, GeistMono.variable)}>
      <body className="bg-background text-foreground antialiased font-sans">
        <TooltipProvider delayDuration={200}>
          <AuthProvider>
            <ConditionalToaster />
            {children}
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
