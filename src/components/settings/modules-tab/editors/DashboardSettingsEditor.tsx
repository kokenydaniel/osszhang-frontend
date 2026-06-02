'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DASHBOARD_WIDGET_LABELS,
  type DashboardSettings,
  type DashboardWidgetId,
} from '@/settings/dashboard';

export function DashboardSettingsEditor({
  value,
  onChange,
}: {
  value: DashboardSettings;
  onChange: (next: DashboardSettings) => void;
}) {
  const move = (index: number, direction: -1 | 1) => {
    const next = [...value.widget_order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ widget_order: next });
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground leading-relaxed">
        A vezérlőpult szekcióinak sorrendje — felülről lefelé jelennek meg.
      </p>
      {value.widget_order.map((id, index) => (
        <div
          key={id}
          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
        >
          <span className="text-sm font-medium text-foreground">
            {index + 1}. {DASHBOARD_WIDGET_LABELS[id as DashboardWidgetId]}
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              aria-label="Fel"
            >
              <ChevronUp size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={index === value.widget_order.length - 1}
              onClick={() => move(index, 1)}
              aria-label="Le"
            >
              <ChevronDown size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
