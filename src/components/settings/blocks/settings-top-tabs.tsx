'use client';

import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { SegmentedControl } from '@/components/design';

export interface SettingsTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
}

export function SettingsTopTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: SettingsTabItem[];
  active: T;
  onChange: (id: T) => void;
}) {
  const activeTab = tabs.find((tab) => tab.id === active);
  const ActiveIcon = activeTab?.icon;

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="md:hidden">
        <label htmlFor="settings-section-select" className="sr-only">
          Beállítások szekció
        </label>
        <div className="relative">
          {ActiveIcon ? (
            <ActiveIcon
              size={16}
              strokeWidth={2.2}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary"
              aria-hidden
            />
          ) : null}
          <select
            id="settings-section-select"
            value={active}
            onChange={(e) => onChange(e.target.value as T)}
            className="h-11 w-full min-w-0 appearance-none rounded-xl border border-border bg-card py-2 pl-10 pr-10 text-sm font-semibold text-foreground shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            strokeWidth={2.2}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>
        {activeTab?.hint ? (
          <p className="mt-2 px-0.5 text-xs leading-relaxed text-muted-foreground">{activeTab.hint}</p>
        ) : null}
      </div>

      <SegmentedControl
        className="hidden md:flex w-full max-w-full"
        layoutId="settings-main-tabs"
        value={active}
        onChange={onChange}
        options={tabs.map((tab) => ({
          value: tab.id as T,
          label: tab.label,
          icon: tab.icon,
        }))}
      />
    </div>
  );
}
