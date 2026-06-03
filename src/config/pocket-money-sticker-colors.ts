import type { CSSProperties } from 'react';

/** Előre definiált matrica háttérszínek (hex). */
export const POCKET_MONEY_STICKER_BG_PRESETS = [
  { hex: '#FCD34D', label: 'Napsárga' },
  { hex: '#FDBA74', label: 'Barack' },
  { hex: '#FDA4AF', label: 'Rózsaszín' },
  { hex: '#C4B5FD', label: 'Lila' },
  { hex: '#93C5FD', label: 'Égkék' },
  { hex: '#67E8F9', label: 'Türkiz' },
  { hex: '#6EE7B7', label: 'Menta' },
  { hex: '#BEF264', label: 'Lime' },
  { hex: '#E9D5FF', label: 'Lavender' },
  { hex: '#F5F5F4', label: 'Krém' },
] as const;

/** Ikon szín presetek (sötétebb, jól olvasható). */
export const POCKET_MONEY_ICON_COLOR_PRESETS = [
  { hex: '#78350F', label: 'Barna' },
  { hex: '#9F1239', label: 'Bordó' },
  { hex: '#5B21B6', label: 'Lila' },
  { hex: '#1E3A8A', label: 'Kék' },
  { hex: '#065F46', label: 'Zöld' },
  { hex: '#1F2937', label: 'Sötét' },
  { hex: '#FFFFFF', label: 'Fehér' },
] as const;

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidStickerHex(value: string | null | undefined): value is string {
  return typeof value === 'string' && HEX_RE.test(value.trim());
}

export function normalizeStickerHex(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  const v = value.trim();
  if (!HEX_RE.test(v)) return null;
  return v.toUpperCase();
}

function clampChannel(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

/** Egyszerű sötétítés gradienshez. */
export function shadeHex(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = clampChannel(((n >> 16) & 0xff) + amount);
  const g = clampChannel(((n >> 8) & 0xff) + amount);
  const b = clampChannel((n & 0xff) + amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

export function stickerBackgroundStyle(hex: string | null | undefined): CSSProperties | undefined {
  const color = normalizeStickerHex(hex);
  if (!color) return undefined;
  return {
    background: `linear-gradient(145deg, ${color} 0%, ${shadeHex(color, -28)} 100%)`,
  };
}

export function iconColorStyle(hex: string | null | undefined): CSSProperties | undefined {
  const color = normalizeStickerHex(hex);
  if (!color) return undefined;
  return { color };
}
