'use client';

import classNames from 'classnames';
import { motion } from 'motion/react';
import { resolvePocketMoneyIcon } from '@/config/pocket-money-icons';
import {
  iconColorStyle,
  isValidStickerHex,
  stickerBackgroundStyle,
} from '@/config/pocket-money-sticker-colors';

type PocketMoneyAvatarProps = {
  iconId: string;
  size?: 'sm' | 'md' | 'lg' | 'sticker';
  variant?: 'default' | 'sticker';
  className?: string;
  active?: boolean;
  animate?: boolean;
  stickerColor?: string | null;
  iconColor?: string | null;
};

const sizeClasses: Record<'sm' | 'md' | 'lg' | 'sticker', string> = {
  sm: 'h-8 w-8 [&_svg]:h-4 [&_svg]:w-4 rounded-lg',
  md: 'h-10 w-10 [&_svg]:h-5 [&_svg]:w-5 rounded-xl',
  lg: 'h-12 w-12 [&_svg]:h-6 [&_svg]:w-6 rounded-xl',
  sticker: 'h-[4.25rem] w-[4.25rem] [&_svg]:h-9 [&_svg]:w-9 sm:h-[4.75rem] sm:w-[4.75rem] sm:[&_svg]:h-10 sm:[&_svg]:w-10',
};

const STICKER_PALETTES = [
  { bg: 'bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300', icon: 'text-amber-950' },
  { bg: 'bg-gradient-to-br from-sky-300 via-cyan-300 to-blue-400', icon: 'text-sky-950' },
  { bg: 'bg-gradient-to-br from-violet-300 via-purple-300 to-fuchsia-300', icon: 'text-violet-950' },
  { bg: 'bg-gradient-to-br from-emerald-300 via-green-300 to-teal-300', icon: 'text-emerald-950' },
  { bg: 'bg-gradient-to-br from-pink-300 via-rose-300 to-red-300', icon: 'text-rose-950' },
  { bg: 'bg-gradient-to-br from-lime-300 via-yellow-300 to-amber-200', icon: 'text-lime-950' },
];

function paletteForIcon(iconId: string) {
  let hash = 0;
  for (let i = 0; i < iconId.length; i++) hash = (hash + iconId.charCodeAt(i) * (i + 1)) % 9973;
  return STICKER_PALETTES[hash % STICKER_PALETTES.length];
}

function StickerFace({
  iconClassName,
  customIconStyle,
  Lucide,
  ReactIcon,
}: {
  iconClassName: string;
  customIconStyle?: React.CSSProperties;
  Lucide: ReturnType<typeof resolvePocketMoneyIcon>['lucide'];
  ReactIcon: ReturnType<typeof resolvePocketMoneyIcon>['reactIcon'];
}) {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/45 via-white/10 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[2px] rounded-full ring-1 ring-inset ring-white/35"
      />
      <span
        className={classNames('relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]', iconClassName)}
        style={customIconStyle}
      >
        {Lucide ? <Lucide strokeWidth={2.5} /> : ReactIcon ? <ReactIcon /> : null}
      </span>
    </>
  );
}

export function PocketMoneyAvatar({
  iconId,
  size = 'md',
  variant = 'default',
  className,
  active,
  animate = true,
  stickerColor,
  iconColor,
}: PocketMoneyAvatarProps) {
  const def = resolvePocketMoneyIcon(iconId);
  const Lucide = def.lucide;
  const ReactIcon = def.reactIcon;
  const isSticker = variant === 'sticker' || size === 'sticker';
  const resolvedSize = isSticker ? 'sticker' : size;
  const palette = paletteForIcon(iconId);
  const customBg = isValidStickerHex(stickerColor) ? stickerColor : null;
  const customIcon = isValidStickerHex(iconColor) ? iconColor : null;
  const bgStyle = stickerBackgroundStyle(customBg);
  const icStyle = iconColorStyle(customIcon);

  const stickerClasses = classNames(
    'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
    sizeClasses[resolvedSize],
    'rounded-full',
    !bgStyle && palette.bg,
    'ring-[3px] ring-white/95',
    'shadow-[2px_4px_0_rgba(15,23,42,0.14),0_10px_20px_-8px_rgba(15,23,42,0.25)]',
    active && [
      'ring-[4px] ring-white',
      'shadow-[4px_8px_0_rgba(15,23,42,0.18),0_16px_28px_-6px_rgba(15,23,42,0.32)]',
      'z-10',
    ],
    className,
  );

  const defaultClasses = classNames(
    'relative inline-flex shrink-0 items-center justify-center rounded-xl border text-primary',
    'bg-primary/10 border-primary/15 transition-all duration-300',
    sizeClasses[resolvedSize],
    active && 'border-primary ring-2 ring-primary/30 scale-[1.02]',
    className,
  );

  if (!isSticker) {
    const smBg = stickerBackgroundStyle(customBg);
    const smIcon = iconColorStyle(customIcon);
    return (
      <span className={defaultClasses} style={smBg} title={def.label} aria-hidden>
        <span style={smIcon} className={!smIcon ? undefined : 'flex items-center justify-center'}>
          {Lucide ? <Lucide strokeWidth={2} /> : ReactIcon ? <ReactIcon /> : null}
        </span>
      </span>
    );
  }

  const face = (
    <StickerFace
      iconClassName={customIcon ? '' : palette.icon}
      customIconStyle={icStyle}
      Lucide={Lucide}
      ReactIcon={ReactIcon}
    />
  );

  const motionProps = {
    title: def.label,
    'aria-hidden': true as const,
    className: stickerClasses,
    style: bgStyle,
    initial: false as const,
    animate: {
      rotate: active ? -6 : -2,
      scale: active ? 1.07 : 1,
      y: active ? -3 : 0,
    },
    whileHover: { rotate: -8, scale: 1.09, y: -4 },
    transition: { type: 'spring' as const, stiffness: 380, damping: 24 },
  };

  if (animate) {
    return <motion.span {...motionProps}>{face}</motion.span>;
  }

  return (
    <span
      className={classNames(stickerClasses, 'transition-transform duration-300', active && '-rotate-6 scale-[1.07]')}
      style={bgStyle}
      title={def.label}
      aria-hidden
    >
      {face}
    </span>
  );
}
