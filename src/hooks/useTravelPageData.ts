'use client';

import { useCallback } from 'react';
import { aiFinanceClient, savingsClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/helpers/api-error-message';
import { unwrapApiData } from '@/utils/unwrap-api-data';
import type { AiTravelPlan } from '@/types';
import { StatusCodes } from '@/types/api';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { formatHUF } from '@/utils';

export type TravelFormInput = {
  destination: string;
  durationDays: string;
  totalBudget: string;
  targetDate: string;
};

export function useTravelPageData() {
  const { addNotification } = useNotificationStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);

  const generatePlan = useCallback(
    async (values: TravelFormInput): Promise<AiTravelPlan | null> => {
      const destination = values.destination.trim();
      const durationDays = Number.parseInt(values.durationDays, 10);
      const totalBudget = Number.parseFloat(values.totalBudget.replace(/\s/g, '').replace(',', '.'));

      if (!destination) {
        addNotification('Add meg az úti célt.', 'error');
        return null;
      }
      if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 90) {
        addNotification('Az utazás hossza 1–90 nap között lehet.', 'error');
        return null;
      }
      if (!Number.isFinite(totalBudget) || totalBudget < 1000) {
        addNotification('A költségkeretnek legalább 1 000 Ft-nak kell lennie.', 'error');
        return null;
      }

      try {
        const res = await aiFinanceClient.planTravel(
          {
            destination,
            duration_days: durationDays,
            total_budget: totalBudget,
          },
          { silent: true },
        );
        if (!res || res[0] !== StatusCodes.Http200) {
          addNotification(
            getApiErrorMessage(res?.[0] ?? 0, res?.[1] ?? null, 'Az utazástervezés nem sikerült. Próbáld újra később.'),
            'error',
          );
          return null;
        }
        return unwrapApiData<AiTravelPlan>(res[1]);
      } catch {
        addNotification('Az utazástervezés nem sikerült. Próbáld újra később.', 'error');
        return null;
      }
    },
    [addNotification],
  );

  const saveAsGoal = useCallback(
    async (plan: AiTravelPlan, targetDate: string) => {
      if (!targetDate) {
        addNotification('Add meg a tervezett utazás dátumát.', 'error');
        return false;
      }
      if (activeWalletId === null) {
        addNotification('Válassz pénztárcát a megtakarítási cél mentéséhez.', 'error');
        return false;
      }

      try {
        const res = await savingsClient.create({
          type: 'goal',
          institution: `Utazás: ${plan.destination}`,
          goal_amount: plan.total_estimated_cost,
          current_amount: 0,
          target_date: targetDate,
          wallet_id: activeWalletId,
          count_in_savings: true,
        });
        if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
          addNotification(
            getApiErrorMessage(res?.[0] ?? 0, res?.[1] ?? null, 'A megtakarítási cél mentése nem sikerült.'),
            'error',
          );
          return false;
        }

        addNotification(
          `„${plan.destination}” utazás mentve megtakarítási célként (${formatHUF(plan.total_estimated_cost)}).`,
          'success',
        );
        return true;
      } catch {
        addNotification('A megtakarítási cél mentése nem sikerült.', 'error');
        return false;
      }
    },
    [activeWalletId, addNotification],
  );

  return { generatePlan, saveAsGoal };
}
