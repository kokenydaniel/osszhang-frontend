'use client';

import { useCallback, useEffect, useState } from 'react';
import { savingsClient, travelClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/helpers/api-error-message';
import { getApiErrorMessage as getClientErrorMessage } from '@/lib/api-client';
import { unwrapApiData } from '@/utils/unwrap-api-data';
import type { AiMeta, AiTravelPlan } from '@/types/ai';
import type { SavedTravelPlanRecord, TravelFormInput } from '@/types/travel';
import { buildTravelPlanPayload } from '@/calculations/travel';
import { StatusCodes } from '@/types/api';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useExchangeRatesStore } from '@/stores/useExchangeRatesStore';
import { formatHUF } from '@/utils';
import { fetchExchangeRates } from '@/utils/exchange-rates';

export type { TravelFormInput } from '@/types/travel';

export function useTravelPageData() {
  const { addNotification } = useNotificationStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const exchangeRates = useExchangeRatesStore((s) => s.rates);
  const setExchangeRates = useExchangeRatesStore((s) => s.setRates);
  const [savedPlans, setSavedPlans] = useState<SavedTravelPlanRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    if (Object.keys(exchangeRates).length === 0) {
      void fetchExchangeRates().then(setExchangeRates);
    }
  }, [exchangeRates, setExchangeRates]);

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const plans = await travelClient.listPlans(activeWalletId);
      setSavedPlans(plans);
    } catch {
      setSavedPlans([]);
    } finally {
      setHistoryLoading(false);
      setInitialLoaded(true);
    }
  }, [activeWalletId]);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  const generatePlan = useCallback(
    async (
      values: TravelFormInput,
    ): Promise<{ plan: AiTravelPlan; meta: AiMeta | null } | null> => {
      const rates =
        Object.keys(exchangeRates).length > 0
          ? exchangeRates
          : await fetchExchangeRates().then((loaded) => {
              setExchangeRates(loaded);
              return loaded;
            });
      const payload = buildTravelPlanPayload(values, activeWalletId, rates);

      if (!payload.destination) {
        addNotification('Add meg az úti célt.', 'error');
        return null;
      }
      if (!Number.isFinite(payload.duration_days) || payload.duration_days < 1 || payload.duration_days > 90) {
        addNotification('Az utazás hossza 1–90 nap között lehet.', 'error');
        return null;
      }
      if (!Number.isFinite(payload.total_budget) || payload.total_budget < 1000) {
        addNotification('A költségkeretnek legalább 1 000 Ft-nak kell lennie.', 'error');
        return null;
      }
      if (payload.transport_mode === 'car' && !payload.car_fuel_consumption_l100) {
        addNotification('Autóval utazásnál add meg a fogyasztást (l/100 km).', 'error');
        return null;
      }

      try {
        const res = await travelClient.planTravel(payload, { silent: true });
        if (!res || res[0] !== StatusCodes.Http200) {
          addNotification(
            getApiErrorMessage(res?.[0] ?? 0, res?.[1] ?? null, 'Az utazástervezés nem sikerült. Próbáld újra később.'),
            'error',
          );
          return null;
        }

        const envelope = res[1] as { data?: AiTravelPlan; meta?: AiMeta };
        const plan = unwrapApiData<AiTravelPlan>(envelope);
        if (!plan?.destination || !Array.isArray(plan.daily_itinerary) || plan.daily_itinerary.length === 0) {
          addNotification('Az utazástervezés válasza hiányos. Próbáld újra később.', 'error');
          return null;
        }
        await refreshHistory();
        return { plan, meta: envelope.meta ?? null };
      } catch (err) {
        addNotification(getClientErrorMessage(err, 'Az utazástervezés nem sikerült. Próbáld újra később.'), 'error');
        return null;
      }
    },
    [activeWalletId, addNotification, exchangeRates, refreshHistory, setExchangeRates],
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
          goal_amount: plan.remaining_to_pay_huf ?? plan.total_estimated_cost,
          current_amount: 0,
          target_date: targetDate,
          wallet_id: activeWalletId,
          count_in_savings: true,
          travelPlanId: plan.saved_plan_id,
        });
        if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
          addNotification(
            getApiErrorMessage(res?.[0] ?? 0, res?.[1] ?? null, 'A megtakarítási cél mentése nem sikerült.'),
            'error',
          );
          return false;
        }

        const saving = unwrapApiData<{ id: number }>(res[1]);
        if (plan.saved_plan_id && saving?.id) {
          await travelClient.linkSaving(plan.saved_plan_id, saving.id);
        }

        addNotification(
          `„${plan.destination}” utazás mentve megtakarítási célként (${formatHUF(plan.remaining_to_pay_huf ?? plan.total_estimated_cost)}).`,
          'success',
        );
        await refreshHistory();
        return true;
      } catch (err) {
        addNotification(getClientErrorMessage(err, 'A megtakarítási cél mentése nem sikerült.'), 'error');
        return false;
      }
    },
    [activeWalletId, addNotification, refreshHistory],
  );

  const deleteSavedPlan = useCallback(
    async (planId: number) => {
      const ok = await travelClient.deletePlan(planId);
      if (!ok) {
        addNotification('A terv törlése nem sikerült.', 'error');
        return false;
      }
      addNotification('Utazási terv törölve.', 'success');
      await refreshHistory();
      return true;
    },
    [addNotification, refreshHistory],
  );

  const loadSavedPlan = useCallback(async (planId: number) => {
    return travelClient.getPlan(planId);
  }, []);

  return {
    generatePlan,
    saveAsGoal,
    deleteSavedPlan,
    loadSavedPlan,
    savedPlans,
    historyLoading,
    initialLoaded,
    refreshHistory,
  };
}
