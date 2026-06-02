'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { getApiErrorMessage } from '@/lib/api-client';
import { Mail, Lock, Loader2, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { AuthMarketingPanel } from '@/components/auth/AuthMarketingPanel';
import { AppLogo } from '@/components/layout/app-logo';
import { HELP } from '@/config/help';
import { motion } from 'motion/react';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({
        username: username.trim().toLowerCase(),
        password,
      });
      router.replace('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Hiba történt a bejelentkezés során.'));
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1.15fr)_460px] xl:grid-cols-[minmax(0,1.2fr)_480px] 2xl:grid-cols-[minmax(0,1.25fr)_500px] bg-background">
      <AuthMarketingPanel />

      <div className="relative flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-12 border-l border-border bg-card">
        <div className="lg:hidden mb-10">
          <AppLogo size="md" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm mx-auto"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Üdv újra</h1>
          <p className="mt-2 text-sm text-muted-foreground">Lépj be a fiókodba a folytatáshoz.</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive flex items-center gap-2"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="space-y-1.5">
              <FieldLabel className="text-xs font-medium text-foreground" info={HELP.auth.username}>
                Felhasználónév
              </FieldLabel>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  type="text"
                  className="pl-9 h-10"
                  placeholder="pl. dani"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  required
                  autoComplete="username"
                  pattern="[a-z0-9_]{3,32}"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel className="text-xs font-medium text-foreground" info={HELP.auth.password}>
                Jelszó
              </FieldLabel>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  type="password"
                  className="pl-9 h-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full mt-2 shadow-glow">
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Bejelentkezés
                  <ArrowRight size={15} />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-[0.7rem] uppercase tracking-wider font-medium text-muted-foreground">
                Még nem vagy fent
              </span>
            </div>
          </div>

          <Link
            href="/register"
            className="group block rounded-lg border border-border bg-gradient-to-br from-primary/[0.04] via-card to-card p-4 hover:border-primary/30 hover:shadow-soft transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-violet-500 text-primary-foreground shadow-sm">
                <Users size={15} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
                  Új háztartás létrehozása
                  <ArrowRight
                    size={13}
                    className="text-primary transition-transform group-hover:translate-x-0.5"
                  />
                </p>
                <p className="text-[0.78rem] text-muted-foreground mt-0.5 leading-snug">
                  Indítsd el a saját családi pénzügyi rendszered néhány perc alatt.
                </p>
              </div>
            </div>
          </Link>

          <p className="mt-6 text-center text-[0.7rem] text-muted-foreground">
            Új tagokat az adminisztrátor a beállításokban vehet fel.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
