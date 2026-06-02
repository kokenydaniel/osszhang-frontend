'use client';

import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/ui/FormField';
import { formatDisplayName } from '@/utils/person-name';
import type { UtilitiesSettings } from '@/settings/utilities';
import type { UserProfile } from '@/types';

export function UtilitiesSettingsEditor({
  value,
  onChange,
  members,
}: {
  value: UtilitiesSettings;
  onChange: (next: UtilitiesSettings) => void;
  members: UserProfile[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Előző hónap sablonjainak másolása</p>
          <p className="text-xs text-muted-foreground mt-0.5">Új hónapnál alapból másolja a rezsi sablon tételeket.</p>
        </div>
        <Switch
          checked={value.clone_from_previous_month}
          onCheckedChange={(checked) => onChange({ ...value, clone_from_previous_month: checked })}
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Elszámolás javaslat</p>
          <p className="text-xs text-muted-foreground mt-0.5">Havi elszámolásnál automatikus javaslat megjelenítése.</p>
        </div>
        <Switch
          checked={value.settlement_auto_suggest}
          onCheckedChange={(checked) => onChange({ ...value, settlement_auto_suggest: checked })}
        />
      </div>

      <FormField label="Alap fizető" info="Új rezsi tételnél előre kiválasztott háztartási tag.">
        <select
          className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
          value={value.default_payer_user_id ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              default_payer_user_id: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value="">Nincs alapértelmezés</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {formatDisplayName(m.first_name, m.last_name)}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}
