'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/api';
import {
  Mail,
  Lock,
  Command,
  ShieldCheck,
  Loader2,
  ArrowRight,
  TrendingUp,
  Home,
  PiggyBank,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import { motion } from 'motion/react';

const features = [
  {
    icon: TrendingUp,
    title: 'Cashflow & költségvetés',
    text: 'Bevételek, kiadások, kategóriák — átláthatóan.',
    gradient: 'from-primary to-violet-500',
  },
  {
    icon: Home,
    title: 'Rezsi és mérőórák',
    text: 'Számlák és fogyasztás automatikus elszámolással.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: PiggyBank,
    title: 'Megtakarítások',
    text: 'Számlák, állampapírok és vagyon egy nézetben.',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authClient.login({ email, password });
      if (res.data.access_token) {
        localStorage.setItem('auth_token', res.data.access_token);
        router.push('/');
      }
    } catch (err) {
      const apiErr = err as { response?: { status?: number } };
      setError(
        apiErr.response?.status === 401 || apiErr.response?.status === 422
          ? 'Hibás felhasználónév vagy jelszó.'
          : 'Hiba történt a bejelentkezés során.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_500px] bg-background">
      {/* Left – content panel with mesh gradient */}
      <div className="relative hidden lg:flex flex-col justify-between px-12 xl:px-16 py-12 overflow-hidden">
        {/* Background mesh */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, oklch(0.56 0.24 275 / 0.12) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, oklch(0.62 0.16 200 / 0.10) 0%, transparent 50%),
              radial-gradient(circle at 50% 90%, oklch(0.65 0.18 150 / 0.08) 0%, transparent 50%),
              oklch(0.992 0.003 250)
            `,
          }}
        />
        <div className="absolute inset-0 -z-10 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, oklch(0.20 0.02 265) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-violet-500 shadow-glow">
            <Command size={18} className="text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-base font-semibold tracking-tight">PénzPilot</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md space-y-10"
        >
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 mb-5"
            >
              <Sparkles size={11} className="text-primary" strokeWidth={2.3} />
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                Háztartás menedzser
              </span>
            </motion.div>
            <h2 className="text-4xl xl:text-[3.25rem] font-semibold tracking-tight text-foreground leading-[1.02]">
              Pénzügyek,
              <br />
              <span className="text-gradient">kapcsolva.</span>
            </h2>
            <p className="mt-5 text-base text-muted-foreground/90 max-w-sm leading-relaxed">
              Bevételek, kiadások, rezsi, megtakarítások és tartozások —
              egyetlen letisztult, modern felületen.
            </p>
          </div>

          <ul className="space-y-3.5">
            {features.map(({ icon: Icon, title, text, gradient }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.2 + i * 0.08 }}
                className="flex items-start gap-3 group"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${gradient} text-white shadow-sm group-hover:shadow-md transition-shadow`}
                >
                  <Icon size={14} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-[0.8rem] text-muted-foreground">{text}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={13} className="text-primary" />
            Privát családi rendszer · {new Date().getFullYear()}
          </span>
        </div>
      </div>

      {/* Right – form */}
      <div className="relative flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-12 border-l border-border bg-card">
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-violet-500 shadow-glow">
            <Command size={17} className="text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-base font-semibold">PénzPilot</span>
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
              <FieldLabel className="text-xs font-medium text-foreground" info={HELP.auth.email}>
                E-mail
              </FieldLabel>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  type="email"
                  className="pl-9 h-10"
                  placeholder="nev@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
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

          {/* Divider */}
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

          {/* Create household CTA */}
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
