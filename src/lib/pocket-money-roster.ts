import { householdClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import {
  createRosterMemberId,
  pocketMoneySettingsForApi,
  resolvePocketMoneySettings,
  rosterMemberKey,
} from '@/settings/pocket-money';
import { useAuthStore } from '@/stores/useAuthStore';
import { pocketMoneyMemberKey } from '@/calculations/pocket-money';
import type { PocketMoneyRosterMember } from '@/types/pocket-money';

export async function persistPocketMoneySettings(
  settings: ReturnType<typeof resolvePocketMoneySettings>,
): Promise<boolean> {
  const res = await householdClient.update({
    pocket_money_settings: pocketMoneySettingsForApi(settings),
  });
  if (!res || res[0] !== StatusCodes.Http200) return false;
  useAuthStore.getState().patchHousehold(res[1] as Record<string, unknown>);
  return true;
}

export async function persistPocketMoneyRoster(members: PocketMoneyRosterMember[]): Promise<boolean> {
  const user = useAuthStore.getState().user;
  const settings = resolvePocketMoneySettings(user?.household);
  return persistPocketMoneySettings({ ...settings, members });
}

export function upsertRosterMember(
  roster: PocketMoneyRosterMember[],
  member: PocketMoneyRosterMember,
  mode: 'create' | 'update',
): PocketMoneyRosterMember[] {
  const key = pocketMoneyMemberKey(member.memberUserId, member.label);

  if (mode === 'update') {
    return roster.map((m) => (m.id === member.id ? { ...member, id: m.id } : m));
  }

  const id = member.id || createRosterMemberId();
  const withoutDupes = roster.filter(
    (m) =>
      !(
        m.id.startsWith('legacy-') &&
        pocketMoneyMemberKey(m.memberUserId, m.label) === key
      ) && m.id !== id,
  );

  return [...withoutDupes, { ...member, id }].sort((a, b) => a.label.localeCompare(b.label, 'hu'));
}

export function removeRosterMember(
  roster: PocketMoneyRosterMember[],
  member: Pick<PocketMoneyRosterMember, 'id' | 'memberUserId' | 'label'>,
): PocketMoneyRosterMember[] {
  const key = pocketMoneyMemberKey(member.memberUserId, member.label);
  return roster.filter((m) => m.id !== member.id && rosterMemberKey(m) !== key);
}
