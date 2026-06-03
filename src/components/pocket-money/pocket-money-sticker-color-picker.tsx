'use client';

import classNames from 'classnames';
import {
  POCKET_MONEY_ICON_COLOR_PRESETS,
  POCKET_MONEY_STICKER_BG_PRESETS,
  normalizeStickerHex,
} from '@/config/pocket-money-sticker-colors';

type PocketMoneyStickerColorPickerProps = {
  stickerColor: string | null;
  iconColor: string | null;
  onStickerColorChange: (hex: string | null) => void;
  onIconColorChange: (hex: string | null) => void;
};

function SwatchGrid({
  presets,
  value,
  onChange,
  allowClear,
}: {
  presets: readonly { hex: string; label: string }[];
  value: string | null;
  onChange: (hex: string | null) => void;
  allowClear?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {allowClear ? (
        <button
          type="button"
          title="Alapértelmezett"
          onClick={() => onChange(null)}
          className={classNames(
            'h-8 min-w-[2.5rem] rounded-lg border border-dashed px-2 text-[0.65rem] text-muted-foreground',
            value === null ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted',
          )}
        >
          Auto
        </button>
      ) : null}
      {presets.map((p) => {
        const selected = value === p.hex.toUpperCase() || value === p.hex;
        return (
          <button
            key={p.hex}
            type="button"
            title={p.label}
            onClick={() => onChange(p.hex)}
            className={classNames(
              'h-8 w-8 rounded-lg border-2 shadow-sm transition-transform hover:scale-105',
              selected ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-white/80',
            )}
            style={{ backgroundColor: p.hex }}
          />
        );
      })}
    </div>
  );
}

export function PocketMoneyStickerColorPicker({
  stickerColor,
  iconColor,
  onStickerColorChange,
  onIconColorChange,
}: PocketMoneyStickerColorPickerProps) {
  const stickerInput = stickerColor ?? '#FCD34D';
  const iconInput = iconColor ?? '#78350F';

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Matrica háttere (opcionális)</p>
        <SwatchGrid
          presets={POCKET_MONEY_STICKER_BG_PRESETS}
          value={normalizeStickerHex(stickerColor)}
          onChange={onStickerColorChange}
          allowClear
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">Saját:</span>
          <input
            type="color"
            value={normalizeStickerHex(stickerColor) ?? stickerInput}
            onChange={(e) => onStickerColorChange(e.target.value.toUpperCase())}
            className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
          />
          {stickerColor ? (
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => onStickerColorChange(null)}
            >
              Törlés
            </button>
          ) : null}
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Ikon színe (opcionális)</p>
        <SwatchGrid
          presets={POCKET_MONEY_ICON_COLOR_PRESETS}
          value={normalizeStickerHex(iconColor)}
          onChange={onIconColorChange}
          allowClear
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">Saját:</span>
          <input
            type="color"
            value={normalizeStickerHex(iconColor) ?? iconInput}
            onChange={(e) => onIconColorChange(e.target.value.toUpperCase())}
            className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
          />
          {iconColor ? (
            <button type="button" className="text-primary hover:underline" onClick={() => onIconColorChange(null)}>
              Törlés
            </button>
          ) : null}
        </label>
      </div>
    </div>
  );
}
