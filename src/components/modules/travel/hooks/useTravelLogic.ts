'use client';

import { useCallback } from 'react';
import { useTravelUi } from '@/components/modules/travel/TravelUiContext';
import { TravelService } from '@/services/TravelService';
import { savingsService } from '@/services/SavingsService';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useWalletStore } from '@/stores/useWalletStore';

export function useTravelLogic() {
  const ui = useTravelUi();
  const { addNotification } = useNotificationStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);

  const handleGeneratePlan = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const destination = ui.destination.trim();
      const durationDays = Number.parseInt(ui.durationDays, 10);
      const totalBudget = Number.parseFloat(ui.totalBudget.replace(/\s/g, '').replace(',', '.'));

      if (!destination) {
        addNotification('Add meg az úti célt.', 'error');
        return;
      }
      if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 90) {
        addNotification('Az utazás hossza 1–90 nap között lehet.', 'error');
        return;
      }
      if (!Number.isFinite(totalBudget) || totalBudget < 1000) {
        addNotification('A költségkeretnek legalább 1 000 Ft-nak kell lennie.', 'error');
        return;
      }

      ui.setIsGenerating(true);
      ui.resetPlan();

      try {
        const plan = await TravelService.planTrip({
          destination,
          durationDays,
          totalBudget,
        });
        ui.setPlan(plan);
      } catch (error) {
        addNotification(
          TravelService.getErrorMessage(error, 'Az utazástervezés nem sikerült. Próbáld újra később.'),
          'error',
        );
      } finally {
        ui.setIsGenerating(false);
      }
    },
    [addNotification, ui],
  );

  const handleSaveAsGoal = useCallback(async () => {
    if (!ui.plan) return;
    if (!ui.targetDate) {
      addNotification('Add meg a tervezett utazás dátumát.', 'error');
      return;
    }
    if (activeWalletId === null) {
      addNotification('Válassz pénztárcát a megtakarítási cél mentéséhez.', 'error');
      return;
    }

    ui.setIsSavingGoal(true);
    try {
      const created = await savingsService.create({
        type: 'goal',
        institution: `Utazás: ${ui.plan.destination}`,
        goalAmount: ui.plan.total_estimated_cost,
        currentAmount: 0,
        targetDate: ui.targetDate,
        walletId: activeWalletId,
      });

      useSavingsStore.getState().appendSavingsItem(created);

      addNotification(
        `„${ui.plan.destination}” utazás mentve megtakarítási célként (${ui.plan.total_estimated_cost.toLocaleString('hu-HU')} Ft).`,
        'success',
      );
    } catch (error) {
      addNotification(
        TravelService.getErrorMessage(error, 'A megtakarítási cél mentése nem sikerült.'),
        'error',
      );
    } finally {
      ui.setIsSavingGoal(false);
    }
  }, [activeWalletId, addNotification, ui]);

  return {
    ...ui,
    handleGeneratePlan,
    handleSaveAsGoal,
  };
}

export type TravelLogicResult = ReturnType<typeof useTravelLogic>;
