'use client';

import { useState } from 'react';
import classNames from 'classnames';
import { AccentPanel } from '@/components/design';
import { Button } from '@/components/ui/button';
import type { AiTravelDayPlan } from '@/types/ai';
import { formatHUF } from '@/utils';
import { ChevronDown } from 'lucide-react';

type TravelDayItineraryProps = {
  days: AiTravelDayPlan[];
};

export function TravelDayItinerary({ days }: TravelDayItineraryProps) {
  const [openDays, setOpenDays] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(days.slice(0, 3).map((d) => [d.day, true])),
  );

  const toggle = (day: number) => {
    setOpenDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const costs = days.map((d) => d.estimated_daily_cost);
  const maxCost = Math.max(...costs, 1);
  const minCost = Math.min(...costs, maxCost);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {days.map((day) => {
        const isOpen = openDays[day.day] ?? false;
        const isExpensive = day.estimated_daily_cost >= maxCost * 0.9 && days.length > 1;
        const isCheap = day.estimated_daily_cost <= minCost * 1.1 && days.length > 1;

        return (
          <AccentPanel
            key={day.day}
            tone="primary"
            title={`${day.day}. nap — ${day.title}`}
            description={formatHUF(day.estimated_daily_cost)}
            className={classNames(isExpensive && 'ring-1 ring-amber-500/30', isCheap && 'ring-1 ring-emerald-500/20')}
          >
            <Button type="button" variant="ghost" size="xs" className="mb-2 -ml-2 gap-1" onClick={() => toggle(day.day)}>
              <ChevronDown size={14} className={classNames('transition-transform', isOpen && 'rotate-180')} />
              {isOpen ? 'Összecsukás' : 'Program megnyitása'}
            </Button>
            {isOpen ? (
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {day.activities.map((activity) => (
                  <li key={activity}>{activity}</li>
                ))}
              </ul>
            ) : null}
          </AccentPanel>
        );
      })}
    </div>
  );
}
