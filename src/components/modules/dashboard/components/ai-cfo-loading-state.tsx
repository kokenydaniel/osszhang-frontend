'use client';

import { SkeletonBlock } from '@/components/design/skeleton-primitives';
import { useRotatingMessage } from '@/components/modules/dashboard/hooks/useRotatingMessage';
import { Loader2 } from 'lucide-react';

const SYNC_MESSAGES = [
  'Pénzügyi adatok szinkronizálása…',
  'Tranzakciók és számlák betöltése…',
  'Költségvetés és rezsi összehangolása…',
  'Megtakarítások és tartozások ellenőrzése…',
] as const;

const THINKING_MESSAGES = [
  'Bevételek és kiadások összesítése…',
  'Havi cashflow elemzése…',
  'Szabad keret kalkulálása…',
  'Kockázatos tételek szűrése…',
  'Személyre szabott tanácsok megfogalmazása…',
  'Havi pénzügyi kép összeállítása…',
] as const;

interface AiCfoLoadingStateProps {
  waitingForData: boolean;
}

export function AiCfoLoadingState({ waitingForData }: AiCfoLoadingStateProps) {
  const message = useRotatingMessage(
    waitingForData ? SYNC_MESSAGES : THINKING_MESSAGES,
    waitingForData ? 2400 : 3000,
    true,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin text-primary shrink-0" />
        <span className="transition-opacity duration-300">{message}</span>
      </div>
      <div className="flex flex-col gap-2 opacity-60">
        <SkeletonBlock className="h-3.5 w-full" />
        <SkeletonBlock className="h-3.5 w-11/12" />
        <SkeletonBlock className="h-3 w-4/5" />
      </div>
    </div>
  );
}
