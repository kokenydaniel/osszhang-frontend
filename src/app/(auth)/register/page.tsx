'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/api';
import {
  Mail,
  Lock,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  Command,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import { motion } from 'motion/react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    password_confirmation: '',
    householdName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('A két jelszó nem egyezik.');
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        household_name: formData.householdName,
      });

      if (res.data.access_token) {
        localStorage.setItem('auth_token', res.data.access_token);
        router.push('/');
      }
    } catch (err) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || 'Hiba történt a regisztráció során.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* Background mesh */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 15% 15%, oklch(0.56 0.24 275 / 0.10) 0%, transparent 45%),
            radial-gradient(circle at 85% 85%, oklch(0.62 0.16 200 / 0.08) 0%, transparent 50%)
          `,
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, oklch(0.20 0.02 265) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg"
        >
          <div className="flex flex-col items-center mb-7">
            <Link
              href="/login"
              className="flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-primary to-violet-500 mb-5 shadow-glow"
            >
              <Command size={20} className="text-primary-foreground" strokeWidth={2.5} />
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 mb-3">
              <Sparkles size={11} className="text-primary" strokeWidth={2.3} />
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                Új háztartás
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Indítsd el a <span className="text-gradient">családi pénztárcát</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              Néhány adattal készíthetsz egy saját, privát háztartást — később meghívhatsz másokat.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 sm:p-8 shadow-lift">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Users size={12} className="text-primary" strokeWidth={2.3} />
                  Adminisztrátor adatai
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FieldLabel className="text-xs font-medium text-foreground" info={HELP.auth.firstName}>
                      Keresztnév
                    </FieldLabel>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      placeholder="Ildi"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel className="text-xs font-medium text-foreground" info={HELP.auth.lastName}>
                      Vezetéknév
                    </FieldLabel>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      placeholder="Kovács"
                    />
                  </div>
                </div>

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
                      className="pl-9"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="nev@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FieldLabel className="text-xs font-medium text-foreground" info={HELP.auth.password}>
                      Jelszó
                    </FieldLabel>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                      <Input
                        type="password"
                        className="pl-8"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel className="text-xs font-medium text-foreground" info={HELP.auth.passwordConfirm}>
                      Megerősítés
                    </FieldLabel>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                      <Input
                        type="password"
                        className="pl-8"
                        value={formData.password_confirmation}
                        onChange={(e) =>
                          setFormData({ ...formData, password_confirmation: e.target.value })
                        }
                        required
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  <ShieldCheck size={12} className="text-primary" strokeWidth={2.3} />
                  Háztartás
                </div>
                <div className="space-y-1.5">
                  <FieldLabel className="text-xs font-medium text-foreground" info={HELP.auth.householdName}>
                    Megnevezés
                  </FieldLabel>
                  <Input
                    placeholder="Pl. Kovács Család"
                    value={formData.householdName}
                    onChange={(e) => setFormData({ ...formData, householdName: e.target.value })}
                    required
                  />
                  <p className="text-[0.7rem] text-muted-foreground">
                    Bármikor változtatható a beállításokban.
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={loading} size="lg" className="w-full shadow-glow">
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Háztartás létrehozása
                    <ArrowRight size={15} />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={12} /> Vissza a bejelentkezéshez
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
