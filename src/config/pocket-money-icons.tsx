'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Star,
  Heart,
  Sparkles,
  Rocket,
  Crown,
  Rainbow,
  Gamepad2,
  Music2,
  Palette,
  Cat,
  Dog,
  Bird,
  Fish,
  Rabbit,
  Squirrel,
  Turtle,
  Bug,
  Flower2,
  Sun,
  Moon,
  Cloud,
} from 'lucide-react';
import type { IconType } from 'react-icons';
import {
  GiBearFace,
  GiCat,
  GiDogHouse,
  GiRabbit,
  GiUnicorn,
  GiDolphin,
  GiButterfly,
  GiFrog,
  GiSnail,
  GiTurtle,
  GiOwl,
  GiLion,
  GiBee,
  GiFishMonster,
  GiCherry,
  GiIceCreamCone,
  GiBalloons,
  GiCakeSlice,
} from 'react-icons/gi';

export type PocketMoneyIconDef = {
  id: string;
  label: string;
  lucide?: LucideIcon;
  reactIcon?: IconType;
};

export const DEFAULT_POCKET_MONEY_ICON_ID = 'star';

export const POCKET_MONEY_ICON_CATALOG: PocketMoneyIconDef[] = [
  { id: 'star', label: 'Csillag', lucide: Star },
  { id: 'heart', label: 'Szív', lucide: Heart },
  { id: 'sparkles', label: 'Szikra', lucide: Sparkles },
  { id: 'rocket', label: 'Rakéta', lucide: Rocket },
  { id: 'crown', label: 'Korona', lucide: Crown },
  { id: 'rainbow', label: 'Szivárvány', lucide: Rainbow },
  { id: 'gamepad', label: 'Játék', lucide: Gamepad2 },
  { id: 'music', label: 'Zene', lucide: Music2 },
  { id: 'palette', label: 'Festék', lucide: Palette },
  { id: 'sun', label: 'Nap', lucide: Sun },
  { id: 'moon', label: 'Hold', lucide: Moon },
  { id: 'cloud', label: 'Felhő', lucide: Cloud },
  { id: 'flower', label: 'Virág', lucide: Flower2 },
  { id: 'cat-l', label: 'Cica', lucide: Cat },
  { id: 'dog-l', label: 'Kutya', lucide: Dog },
  { id: 'bird-l', label: 'Madár', lucide: Bird },
  { id: 'fish-l', label: 'Hal', lucide: Fish },
  { id: 'rabbit-l', label: 'Nyúl', lucide: Rabbit },
  { id: 'squirrel', label: 'Mókus', lucide: Squirrel },
  { id: 'turtle-l', label: 'Teknős', lucide: Turtle },
  { id: 'bug', label: 'Bogár', lucide: Bug },
  { id: 'bear', label: 'Medve', reactIcon: GiBearFace },
  { id: 'cat', label: 'Cica', reactIcon: GiCat },
  { id: 'dog', label: 'Kutya', reactIcon: GiDogHouse },
  { id: 'rabbit', label: 'Nyúl', reactIcon: GiRabbit },
  { id: 'unicorn', label: 'Unikornis', reactIcon: GiUnicorn },
  { id: 'dolphin', label: 'Delfin', reactIcon: GiDolphin },
  { id: 'butterfly', label: 'Pillangó', reactIcon: GiButterfly },
  { id: 'frog', label: 'Béka', reactIcon: GiFrog },
  { id: 'snail', label: 'Csiga', reactIcon: GiSnail },
  { id: 'turtle', label: 'Teknős', reactIcon: GiTurtle },
  { id: 'owl', label: 'Bagoly', reactIcon: GiOwl },
  { id: 'lion', label: 'Oroszlán', reactIcon: GiLion },
  { id: 'bee', label: 'Méhecske', reactIcon: GiBee },
  { id: 'fish', label: 'Halacska', reactIcon: GiFishMonster },
  { id: 'cherry', label: 'Cseresznye', reactIcon: GiCherry },
  { id: 'icecream', label: 'Fagyi', reactIcon: GiIceCreamCone },
  { id: 'balloons', label: 'Lufik', reactIcon: GiBalloons },
  { id: 'cake', label: 'Torta', reactIcon: GiCakeSlice },
];

const iconById = new Map(POCKET_MONEY_ICON_CATALOG.map((i) => [i.id, i]));

export function resolvePocketMoneyIcon(id: string | undefined | null): PocketMoneyIconDef {
  if (id && iconById.has(id)) return iconById.get(id)!;
  return iconById.get(DEFAULT_POCKET_MONEY_ICON_ID)!;
}
