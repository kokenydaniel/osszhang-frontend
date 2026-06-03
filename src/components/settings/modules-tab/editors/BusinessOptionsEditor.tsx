'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { OrderStatusToneSelect } from '@/components/ui/OrderStatusToneSelect';
import { StatusPill } from '@/components/design';
import type { BusinessSettings } from '@/settings/business';
import {
  resolveOrderStatusTone,
  setOrderStatusColor,
  syncOrderStatusColors,
} from '@/settings/business';

type ListKey = 'channels' | 'payment_methods' | 'providers' | 'destinations';

const GROUPS: { key: ListKey; title: string; description: string }[] = [
  {
    key: 'channels',
    title: 'Értékesítési csatornák',
    description: 'Honnan érkezett a rendelés (piac, webshop, privát, stb.)',
  },
  {
    key: 'payment_methods',
    title: 'Fizetési módok',
    description: 'Kártya, utalás, utánvét, készpénz…',
  },
  {
    key: 'providers',
    title: 'Szolgáltatók',
    description: 'Fizetési platform, futár, terminál — vagy „Nincs”',
  },
  {
    key: 'destinations',
    title: 'Hová érkezik a pénz',
    description: 'Pl. szolgáltatónál parkol, privát számla, készpénz',
  },
];

export function BusinessOptionsEditor({
  value,
  onChange,
}: {
  value: BusinessSettings;
  onChange: (next: BusinessSettings) => void;
}) {
  const [drafts, setDrafts] = useState<Record<ListKey, string>>({
    channels: '',
    payment_methods: '',
    providers: '',
    destinations: '',
  });

  const addItem = (key: ListKey) => {
    const label = drafts[key].trim();
    if (!label) return;
    if (value[key].some((x) => x.toLowerCase() === label.toLowerCase())) {
      setDrafts((d) => ({ ...d, [key]: '' }));
      return;
    }
    onChange({ ...value, [key]: [...value[key], label] });
    setDrafts((d) => ({ ...d, [key]: '' }));
  };

  const removeItem = (key: ListKey, label: string) => {
    onChange({ ...value, [key]: value[key].filter((x) => x !== label) });
  };

  const updateStatuses = (statuses: string[]) =>
    onChange(syncOrderStatusColors({ ...value, order_statuses: statuses }));

  return (
    <div className="space-y-6">
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {GROUPS.map((group) => (
        <div
          key={group.key}
          className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm"
        >
          <div>
            <h4 className="text-sm font-semibold text-foreground">{group.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{group.description}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
            {value[group.key].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium"
              >
                {item}
                {value[group.key].length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(group.key, item)}
                    className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`${item} törlése`}
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={drafts[group.key]}
              onChange={(e) => setDrafts((d) => ({ ...d, [group.key]: e.target.value }))}
              placeholder="Új elem…"
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem(group.key);
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => addItem(group.key)}>
              <Plus size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>

    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-foreground">Rendelés státuszok</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Státuszok és színeik a rendeléslistában. Új státusznál alapértelmezetten szürke.
        </p>
      </div>
      <div className="space-y-2">
        {value.order_statuses.map((status) => {
          const tone = resolveOrderStatusTone(value, status);
          return (
            <div
              key={status}
              className="grid grid-cols-[minmax(0,1fr)_8.5rem_auto] items-center gap-2 rounded-lg border border-border bg-muted/10 px-3 py-2"
            >
              <StatusPill status={tone} size="xs" dot>
                {status}
              </StatusPill>
              <OrderStatusToneSelect
                value={tone}
                onChange={(next) => onChange(setOrderStatusColor(value, status, next))}
                className="h-8 text-xs"
              />
              {value.order_statuses.length > 1 && (
                <button
                  type="button"
                  onClick={() => updateStatuses(value.order_statuses.filter((s) => s !== status))}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`${status} törlése`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <StatusDraft
        onAdd={(label) => {
          if (value.order_statuses.some((s) => s.toLowerCase() === label.toLowerCase())) return;
          updateStatuses([...value.order_statuses, label]);
        }}
      />
    </div>
    </div>
  );
}

function StatusDraft({ onAdd }: { onAdd: (label: string) => void }) {
  const [draft, setDraft] = useState('');
  return (
    <div className="flex gap-2">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Új státusz…"
        className="h-8 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const label = draft.trim();
            if (label) onAdd(label);
            setDraft('');
          }
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const label = draft.trim();
          if (label) onAdd(label);
          setDraft('');
        }}
      >
        <Plus size={14} />
      </Button>
    </div>
  );
}
