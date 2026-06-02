'use client';

import React, { useState } from 'react';

import { formatHUF, formatDate } from '@/utils';
import { HELP } from '@/config/help';
import { AccentPanel, InsightBanner } from '@/components/design';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { utilitiesClient } from '@/lib/api-client';
import { syncAfterUtilitiesSettlementMutation } from '@/helpers/utilities-settlement-sync';
import { StatusCodes } from '@/types/api';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import type { UtilitySettlement } from '@/types';
import type { UtilitySplitLabels } from '@/calculations/utilities';
import { AlertTriangle, UserCheck } from 'lucide-react';

interface SettlementPanelProps {
  monthSettlement: UtilitySettlement | undefined;
  utilitySplitEnabled: boolean;
  isAdmin: boolean;
  utilityLabels: UtilitySplitLabels;
  selectedMonth: number;
  selectedYear: number;
}

export function UtilitiesSettlementPanel({
  monthSettlement,
  utilitySplitEnabled,
  isAdmin,
  utilityLabels,
  selectedMonth,
  selectedYear,
}: SettlementPanelProps) {
  const [unsettling, setUnsettling] = useState(false);
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  if (!utilitySplitEnabled) return null;

  const handleUnsettle = () => {
    if (!isAdmin || !monthSettlement) return;
    requestDelete({
      title: 'Elszámolás visszavonása',
      message: 'A havi rezsi elszámolás törlődik. Biztosan folytatod?',
      onConfirm: async () => {
        setUnsettling(true);
        try {
          const res = await utilitiesClient.unsettleMonth(selectedMonth, selectedYear);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          syncAfterUtilitiesSettlementMutation(res[1], {
            selectedYear,
            selectedMonth,
          });
          addNotification('Elszámolás visszavonva.', 'success');
        } catch {
          addNotification('A visszavonás nem sikerült.', 'error');
        } finally {
          setUnsettling(false);
        }
      },
    });
  };

  return (
    <>
      {!utilityLabels.splitPartnerUser && (
        <InsightBanner tone="warning" icon={AlertTriangle} title="A rezsimegosztás be van kapcsolva">
          Nincs másik tag regisztrálva. Hívj meg egy családtagot a Beállítások oldalon.
        </InsightBanner>
      )}

      {monthSettlement && (
        <AccentPanel
          tone="success"
          icon={UserCheck}
          title="Havi tartozás rendezve"
          titleInfo={HELP.utilities.settlementRecord}
          description={monthSettlement.summary}
          action={
            isAdmin ? (
              <Button variant="ghost" size="xs" loading={unsettling} onClick={handleUnsettle}>
                Visszavonás
              </Button>
            ) : undefined
          }
        >
          <div className="text-sm text-foreground/90 space-y-1">
            <p>
              <span className="text-muted-foreground">Dátum:</span>{' '}
              <span className="font-medium tabular-nums">{formatDate(monthSettlement.settledAt)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Költségvetésben:</span>{' '}
              <span className="font-medium">
                {monthSettlement.direction === 'partner_pays_household' ? 'bevétel' : 'kiadás'}
              </span>
              {' · '}
              <span className="tabular-nums">{formatHUF(monthSettlement.amount)}</span>
            </p>
          </div>
        </AccentPanel>
      )}

      <ConfirmDeleteModal />
    </>
  );
}
