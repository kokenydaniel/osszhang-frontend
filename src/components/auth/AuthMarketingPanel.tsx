'use client';

import { dayjs } from '@/utils/dates';
import {
  ArrowDownRight,
  ArrowUpRight,
  Gauge,
  Home,
  Layers3,
  Lock,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppLogo } from '@/components/layout/app-logo';
import { Sparkline } from '@/components/design/Sparkline';
import { APP_DESCRIPTION, APP_TAGLINE } from '@/config/branding';
import classNames from 'classnames';

const highlights = [
  {
    icon: Layers3,
    title: 'Minden modul egy helyen',
    text: 'Költségvetés, rezsi, megtakarítás és tartozások összekapcsolva.',
    tone: 'from-primary/12 to-primary/4 text-primary',
  },
  {
    icon: Users,
    title: 'Közös háztartás',
    text: 'Több tag, egy átlátható pénzügyi kép — privát marad.',
    tone: 'from-sky-500/12 to-sky-500/4 text-sky-700',
  },
  {
    icon: Lock,
    title: 'Csak a tiétek',
    text: 'Nincs reklám, nincs adat-eladás — családi rendszer.',
    tone: 'from-emerald-500/12 to-emerald-500/4 text-emerald-700',
  },
];

const modules = [
  { icon: Wallet, label: 'Költségvetés', tone: 'text-primary bg-primary/10' },
  { icon: Home, label: 'Rezsi', tone: 'text-sky-700 bg-sky-100/80' },
  { icon: PiggyBank, label: 'Megtakarítás', tone: 'text-emerald-700 bg-emerald-100/80' },
  { icon: TrendingDown, label: 'Tartozások', tone: 'text-rose-700 bg-rose-100/80' },
  { icon: Gauge, label: 'Közműórák', tone: 'text-amber-700 bg-amber-100/80' },
  { icon: TrendingUp, label: 'Vállalkozás', tone: 'text-violet-700 bg-violet-100/80' },
];

const cashflowTrend = [420, 480, 445, 510, 498, 560, 542, 610, 588, 642];
const savingsTrend = [980, 995, 1010, 1005, 1040, 1065, 1080, 1110, 1145, 1180];

function AuthPreviewMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[420px] xl:max-w-none">
      <motion.div
        aria-hidden
        initial={{ opacity: 0, rotate: -4, y: 16 }}
        animate={{ opacity: 1, rotate: -3, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-6 top-6 h-[88%] rounded-[1.35rem] border border-border/50 bg-card/40 shadow-soft backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/95 shadow-[0_24px_60px_-28px_oklch(0.20_0.02_265_/_0.28)] backdrop-blur-md"
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.07] to-transparent pointer-events-none" />
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

        <div className="relative border-b border-border/60 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Irányítópult
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">Kovács háztartás</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-border bg-background/80 px-2 py-1 text-[0.62rem] font-medium tabular-nums text-muted-foreground">
                2026. máj.
              </span>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground">
                KI
              </span>
            </div>
          </div>
        </div>

        <div className="relative space-y-3 p-5">
          <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card p-4 shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Havi egyenleg
                </p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  842 500 Ft
                </p>
                <span className="mt-2 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-semibold text-emerald-700">
                  <ArrowUpRight size={10} strokeWidth={2.5} />
                  +4,2% az előző hónaphoz
                </span>
              </div>
              <Sparkline
                values={cashflowTrend}
                width={92}
                height={34}
                stroke="oklch(0.56 0.24 275)"
                fill="oklch(0.56 0.24 275 / 0.18)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <p className="text-[0.62rem] font-medium uppercase tracking-wider text-muted-foreground">
                Kiadás
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-foreground">318 200 Ft</p>
              <span className="mt-1 inline-flex items-center gap-0.5 text-[0.62rem] font-semibold text-rose-600">
                <ArrowDownRight size={10} strokeWidth={2.5} />
                −2,1%
              </span>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <p className="text-[0.62rem] font-medium uppercase tracking-wider text-muted-foreground">
                Megtakarítás
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-foreground">1,2 M Ft</p>
              <span className="mt-1 inline-flex items-center gap-0.5 text-[0.62rem] font-semibold text-emerald-600">
                <ArrowUpRight size={10} strokeWidth={2.5} />
                +18%
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Költségvetés kihasználtság
              </p>
              <span className="text-[0.62rem] font-semibold tabular-nums text-foreground">68%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-primary to-violet-500" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {modules.slice(0, 4).map(({ icon: Icon, label, tone }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[0.6rem] font-medium text-foreground"
                >
                  <span className={classNames('flex h-3.5 w-3.5 items-center justify-center rounded-full', tone)}>
                    <Icon size={8} strokeWidth={2.5} />
                  </span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 16, y: 12 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.55, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -right-2 xl:-right-5 bottom-8 w-[11.5rem] rounded-2xl border border-border/80 bg-card/95 p-3 shadow-lift backdrop-blur-md"
      >
        <p className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Megtakarítás trend
        </p>
        <Sparkline
          values={savingsTrend}
          width={150}
          height={36}
          stroke="oklch(0.65 0.18 150)"
          fill="oklch(0.65 0.18 150 / 0.18)"
          className="mt-2 w-full"
        />
        <p className="mt-2 text-sm font-semibold tabular-nums text-emerald-700">+18,4% / év</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.38 }}
        className="absolute -left-1 xl:-left-4 top-10 rounded-full border border-emerald-200/80 bg-emerald-50/95 px-3 py-1.5 text-[0.62rem] font-semibold text-emerald-700 shadow-soft backdrop-blur-sm"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Élő szinkron
        </span>
      </motion.div>
    </div>
  );
}

export function AuthMarketingPanel() {
  const taglineLead = APP_TAGLINE.split(',')[0];
  const taglineAccent = APP_TAGLINE.split(',')[1]?.trim() ?? 'egy helyen.';

  return (
    <div className="relative hidden lg:flex min-h-screen flex-col overflow-hidden px-10 xl:px-14 py-10 xl:py-12">
      <div
        className="absolute inset-0 -z-20"
        style={{
          background: `
            radial-gradient(circle at 12% 8%, oklch(0.56 0.24 275 / 0.16) 0%, transparent 38%),
            radial-gradient(circle at 88% 18%, oklch(0.62 0.16 200 / 0.12) 0%, transparent 36%),
            radial-gradient(circle at 72% 92%, oklch(0.65 0.18 150 / 0.10) 0%, transparent 42%),
            linear-gradient(180deg, oklch(0.995 0.002 250) 0%, oklch(0.985 0.004 255) 100%)
          `,
        }}
      />

      <div
        className="absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, oklch(0.20 0.02 265 / 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(0.20 0.02 265 / 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
        }}
      />

      <div className="pointer-events-none absolute -z-10 right-0 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -z-10 -left-16 bottom-0 h-72 w-72 rounded-full bg-emerald-500/8 blur-3xl" />

      <div className="relative z-10">
        <AppLogo size="md" />
      </div>

      <div className="relative z-10 flex flex-1 items-center py-8 xl:py-10">
        <div className="grid w-full gap-10 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:gap-12 2xl:gap-16 xl:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1">
              <Sparkles size={11} className="text-primary" strokeWidth={2.3} />
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                Családi pénzügyek
              </span>
            </div>

            <h2 className="mt-5 text-[2.65rem] xl:text-[3.15rem] 2xl:text-[3.35rem] font-semibold tracking-tight text-foreground leading-[1.02]">
              {taglineLead},
              <br />
              <span className="text-gradient">{taglineAccent}</span>
            </h2>

            <p className="mt-5 text-[0.98rem] xl:text-base text-muted-foreground/90 leading-relaxed max-w-md">
              {APP_DESCRIPTION}
            </p>

            <div className="mt-8 space-y-3">
              {highlights.map(({ icon: Icon, title, text, tone }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.12 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 p-3.5 backdrop-blur-sm transition-colors hover:border-primary/20 hover:bg-card/80"
                >
                  <div
                    className={classNames(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
                      tone,
                    )}
                  >
                    <Icon size={15} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-0.5 text-[0.8rem] leading-snug text-muted-foreground">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative xl:pl-2"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            >
              <AuthPreviewMockup />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4 border-t border-border/50 pt-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck size={13} className="text-primary" />
          Privát családi rendszer · {dayjs().year()}
        </span>
        <span className="hidden xl:inline text-muted-foreground/80">6 modul · 1 háztartás · korlátlan áttekintés</span>
      </div>
    </div>
  );
}
