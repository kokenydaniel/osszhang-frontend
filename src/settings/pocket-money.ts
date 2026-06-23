import config from '@/config/config';
import { DEFAULT_POCKET_MONEY_ICON_ID } from '@/config/pocket-money-icons';
import { normalizeStickerHex } from '@/config/pocket-money-sticker-colors';
import { pocketMoneyMemberKey } from '@/calculations/pocket-money';
import type { PocketMoneyEntry, PocketMoneyRosterMember } from '@/types/pocket-money';

export type PocketMoneyInterestBasis = 'no_expense' | 'remaining';

export type PocketMoneyInterestOn = 'balance' | 'month_allowance';

export type PocketMoneySettings = {
  currencies: string[];
  default_currency: string;
  members: PocketMoneyRosterMember[];

  hidden_member_keys: string[];
  interest_enabled: boolean;
  interest_rate_percent: number;
  interest_on: PocketMoneyInterestOn;
  interest_basis: PocketMoneyInterestBasis;
};

export const DEFAULT_POCKET_MONEY_SETTINGS: PocketMoneySettings = {
  currencies: [...config.moduleDefaults.pocket_money.currencies],
  default_currency: config.moduleDefaults.pocket_money.default_currency,
  members: [],
  hidden_member_keys: [],
  interest_enabled: false,
  interest_rate_percent: 10,
  interest_on: 'balance',
  interest_basis: 'no_expense',
};

type HouseholdLike = {
  pocket_money_settings?: PocketMoneySettings;
  pocketMoneySettings?: PocketMoneySettings;
};

type RawRosterMember = {
  id?: string;
  label?: string;
  member_user_id?: number | null;
  memberUserId?: number | null;
  icon?: string;
  sticker_color?: string | null;
  stickerColor?: string | null;
  icon_color?: string | null;
  iconColor?: string | null;
};

function normalizeRosterMember(raw: RawRosterMember): PocketMoneyRosterMember | null {
  const id = String(raw.id ?? '').trim();
  const label = String(raw.label ?? '').trim();
  if (!id || !label) return null;
  const memberUserIdRaw = raw.member_user_id ?? raw.memberUserId ?? null;
  const memberUserId =
    memberUserIdRaw !== null && memberUserIdRaw !== undefined && String(memberUserIdRaw) !== ''
      ? Number(memberUserIdRaw)
      : null;

  const stickerRaw = raw.sticker_color ?? raw.stickerColor ?? null;
  const iconColorRaw = raw.icon_color ?? raw.iconColor ?? null;

  return {
    id,
    label,
    memberUserId: Number.isFinite(memberUserId) ? memberUserId : null,
    icon: String(raw.icon ?? DEFAULT_POCKET_MONEY_ICON_ID).trim() || DEFAULT_POCKET_MONEY_ICON_ID,
    stickerColor: normalizeStickerHex(stickerRaw ? String(stickerRaw) : null),
    iconColor: normalizeStickerHex(iconColorRaw ? String(iconColorRaw) : null),
  };
}

export function resolvePocketMoneySettings(household?: HouseholdLike | null): PocketMoneySettings {
  const raw = household?.pocket_money_settings ?? household?.pocketMoneySettings;
  if (!raw) {
    return {
      ...DEFAULT_POCKET_MONEY_SETTINGS,
      currencies: [...DEFAULT_POCKET_MONEY_SETTINGS.currencies],
      members: [],
      hidden_member_keys: [],
    };
  }

  const currencies = Array.isArray(raw.currencies)
    ? raw.currencies.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
    : [...DEFAULT_POCKET_MONEY_SETTINGS.currencies];

  const defaultCurrency = String(raw.default_currency ?? DEFAULT_POCKET_MONEY_SETTINGS.default_currency)
    .trim()
    .toUpperCase();

  const members = Array.isArray(raw.members)
    ? raw.members
        .map((m) => normalizeRosterMember(m as RawRosterMember))
        .filter((m): m is PocketMoneyRosterMember => m !== null)
    : [];

  const hiddenRaw =
    (raw as { hidden_member_keys?: string[]; hiddenMemberKeys?: string[] }).hidden_member_keys ??
    (raw as { hiddenMemberKeys?: string[] }).hiddenMemberKeys;
  const hidden_member_keys = Array.isArray(hiddenRaw)
    ? hiddenRaw.map((k) => String(k).trim()).filter(Boolean)
    : [];

  const interestEnabled = Boolean(
    raw.interest_enabled ?? (raw as { interestEnabled?: boolean }).interestEnabled ?? DEFAULT_POCKET_MONEY_SETTINGS.interest_enabled,
  );
  const interestRate = Number(
    raw.interest_rate_percent ??
      (raw as { interestRatePercent?: number }).interestRatePercent ??
      DEFAULT_POCKET_MONEY_SETTINGS.interest_rate_percent,
  );
  const interestBasisRaw = String(
    raw.interest_basis ??
      (raw as { interestBasis?: string }).interestBasis ??
      DEFAULT_POCKET_MONEY_SETTINGS.interest_basis,
  );
  const interestBasis: PocketMoneyInterestBasis =
    interestBasisRaw === 'remaining' ? 'remaining' : 'no_expense';

  const interestOnRaw = String(
    raw.interest_on ??
      (raw as { interestOn?: string }).interestOn ??
      DEFAULT_POCKET_MONEY_SETTINGS.interest_on,
  );
  const interestOn: PocketMoneyInterestOn =
    interestOnRaw === 'month_allowance' ? 'month_allowance' : 'balance';

  return {
    currencies: currencies.length > 0 ? currencies : [...DEFAULT_POCKET_MONEY_SETTINGS.currencies],
    default_currency: currencies.includes(defaultCurrency) ? defaultCurrency : currencies[0],
    members,
    hidden_member_keys,
    interest_enabled: interestEnabled,
    interest_rate_percent: Number.isFinite(interestRate) ? Math.min(100, Math.max(0, interestRate)) : 10,
    interest_on: interestOn,
    interest_basis: interestBasis,
  };
}

export type PocketMoneySettingsApiPayload = {
  currencies: string[];
  default_currency: string;
  interest_enabled: boolean;
  interest_rate_percent: number;
  interest_on: PocketMoneyInterestOn;
  interest_basis: PocketMoneyInterestBasis;
  members: {
    id: string;
    label: string;
    member_user_id: number | null;
    icon: string;
    sticker_color: string | null;
    icon_color: string | null;
  }[];
  hidden_member_keys: string[];
};

export function pocketMoneySettingsForApi(settings: PocketMoneySettings): PocketMoneySettingsApiPayload {
  return {
    currencies: settings.currencies.map((c) => c.trim().toUpperCase()).filter(Boolean),
    default_currency: settings.default_currency.trim().toUpperCase(),
    interest_enabled: settings.interest_enabled,
    interest_rate_percent: settings.interest_rate_percent,
    interest_on: settings.interest_on,
    interest_basis: settings.interest_basis,
    members: settings.members.map((m) => ({
      id: m.id,
      label: m.label.trim(),
      member_user_id: m.memberUserId,
      icon: m.icon,
      sticker_color: m.stickerColor ?? null,
      icon_color: m.iconColor ?? null,
    })),
    hidden_member_keys: settings.hidden_member_keys,
  };
}

export function rosterMemberKey(member: Pick<PocketMoneyRosterMember, 'memberUserId' | 'label'>): string {
  return pocketMoneyMemberKey(member.memberUserId, member.label);
}

export function findRosterMemberByKey(
  roster: PocketMoneyRosterMember[],
  memberUserId: number | null,
  memberLabel: string,
): PocketMoneyRosterMember | undefined {
  const key = pocketMoneyMemberKey(memberUserId, memberLabel);
  return roster.find((m) => rosterMemberKey(m) === key);
}

export function findRosterMemberById(
  roster: PocketMoneyRosterMember[],
  id: string,
): PocketMoneyRosterMember | undefined {
  return roster.find((m) => m.id === id);
}

export function mergeRosterWithEntryMembers(
  roster: PocketMoneyRosterMember[],
  entries: PocketMoneyEntry[],
  hiddenMemberKeys: string[] = [],
): PocketMoneyRosterMember[] {
  const hidden = new Set(hiddenMemberKeys);
  const next = roster.filter((m) => !hidden.has(rosterMemberKey(m)));
  const keys = new Set(next.map((m) => rosterMemberKey(m)));

  for (const entry of entries) {
    const key = pocketMoneyMemberKey(entry.memberUserId, entry.memberLabel);
    if (hidden.has(key) || keys.has(key)) continue;
    next.push({
      id: `legacy-${key}`,
      label: entry.memberLabel,
      memberUserId: entry.memberUserId,
      icon: DEFAULT_POCKET_MONEY_ICON_ID,
    });
    keys.add(key);
  }

  return next.sort((a, b) => a.label.localeCompare(b.label, 'hu'));
}

export function createRosterMemberId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `pm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
