'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { InsightBanner } from '@/components/design';
import { Button } from '@/components/ui/button';
import type { MissingDocMonth } from '@/hooks/useBusinessDocumentCoverage';

const MONTH_NAMES = [
  'január',
  'február',
  'március',
  'április',
  'május',
  'június',
  'július',
  'augusztus',
  'szeptember',
  'október',
  'november',
  'december',
];

interface BusinessDocumentCoverageAlertProps {
  missingMonths: MissingDocMonth[];
  onJumpToMonth: (year: number, month: number) => void;
}

export function BusinessDocumentCoverageAlert({
  missingMonths,
  onJumpToMonth,
}: BusinessDocumentCoverageAlertProps) {
  const [expanded, setExpanded] = useState(false);

  if (missingMonths.length === 0) return null;

  const count = missingMonths.length;

  if (count === 1) {
    const { year, month } = missingMonths[0];
    const monthName = MONTH_NAMES[month - 1];

    return (
      <InsightBanner
        tone="warning"
        icon={AlertTriangle}
        title={`Hiányzó könyvelési anyag: ${year}. ${monthName}`}
        action={
          <Button
            size="xs"
            variant="outline"
            className="bg-amber-100/80 hover:bg-amber-200/80 border-amber-300 text-amber-950 font-medium shrink-0"
            onClick={() => onJumpToMonth(year, month)}
          >
            Ugrás a hónapra
            <ArrowRight size={12} className="ml-1" />
          </Button>
        }
      >
        A lezárult hónapra még egyetlen könyvelési dokumentum sincs feltöltve.
      </InsightBanner>
    );
  }

  return (
    <InsightBanner
      tone="warning"
      icon={AlertTriangle}
      title={`${count} lezárult hónapra nincs még feltöltve könyvelési anyag`}
      action={
        <Button
          size="xs"
          variant="ghost"
          className="text-amber-900 hover:bg-amber-100/60 font-medium"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Kevesebb mutató' : 'Hónapok mutatása'}
          {expanded ? <ChevronUp size={13} className="ml-1" /> : <ChevronDown size={13} className="ml-1" />}
        </Button>
      }
    >
      <div>
        <span>Kérjük, visszamenőleg ellenőrizd és pótold a könyvelési csomagodat a lezárult időszakokra.</span>
        {expanded && (
          <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-amber-200/60">
            {missingMonths.map(({ year, month }) => {
              const monthName = MONTH_NAMES[month - 1];
              return (
                <button
                  key={`${year}-${month}`}
                  type="button"
                  onClick={() => onJumpToMonth(year, month)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/90 hover:bg-amber-200 text-amber-950 text-xs font-medium border border-amber-300/80 transition-colors shadow-sm"
                  title="Ugrás a dokumentumokhoz"
                >
                  <span>{year}. {String(month).padStart(2, '0')}. ({monthName})</span>
                  <ArrowRight size={11} className="text-amber-700" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </InsightBanner>
  );
}
