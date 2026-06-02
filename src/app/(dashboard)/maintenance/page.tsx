'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Sparkles, Wrench } from 'lucide-react';
import { AppLogo } from '@/components/layout/app-logo';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { APP_NAME } from '@/config/branding';

export default function MaintenancePage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.22),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex w-full max-w-lg flex-col items-center text-center"
        >
          <AppLogo size="lg" className="mb-8" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 to-violet-500/10 shadow-soft"
          >
            <Wrench className="h-8 w-8 text-primary" strokeWidth={1.75} aria-hidden />
          </motion.div>

          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Hamarosan visszatérünk
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Az {APP_NAME} jelenleg karbantartás alatt van. Finomhangoljuk a rendszert, hogy még
            gördülékenyebb legyen a mindennapi használat — köszönjük a türelmedet.
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-8 flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-primary shrink-0" aria-hidden />
            <span>Bejelentkeztél — amint kész vagyunk, frissítsd az oldalt.</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-10"
          >
            <Button variant="outline" onClick={() => void handleLogout()} className="min-w-[10rem]">
              Kijelentkezés
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
