'use client';

import classNames from 'classnames';
import { POCKET_MONEY_ICON_CATALOG } from '@/config/pocket-money-icons';
import { PocketMoneyAvatar } from './pocket-money-avatar';

type PocketMoneyIconPickerProps = {
  value: string;
  onChange: (iconId: string) => void;
  stickerColor?: string | null;
  iconColor?: string | null;
};

export function PocketMoneyIconPicker({
  value,
  onChange,
  stickerColor,
  iconColor,
}: PocketMoneyIconPickerProps) {
  return (
    <div
      className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1"
      role="radiogroup"
      aria-label="Ikon választása"
    >
      {POCKET_MONEY_ICON_CATALOG.map((icon) => {
        const selected = value === icon.id;
        return (
          <button
            key={icon.id}
            type="button"
            role="radio"
            aria-checked={selected}
            title={icon.label}
            onClick={() => onChange(icon.id)}
            className={classNames(
              'flex flex-col items-center gap-1 rounded-lg p-1.5 transition-colors',
              selected ? 'bg-primary/10' : 'hover:bg-muted',
            )}
          >
            <PocketMoneyAvatar
              iconId={icon.id}
              variant="sticker"
              active={selected}
              animate={false}
              stickerColor={selected ? stickerColor : null}
              iconColor={selected ? iconColor : null}
              className="!h-9 !w-9 [&_svg]:!h-4 [&_svg]:!w-4"
            />
            <span className="text-[0.6rem] text-muted-foreground truncate w-full text-center">
              {icon.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
