'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Plus, Building2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, MetricStrip, ModulePageSkeleton, SectionPanel } from '@/components/design';
import { HELP } from '@/config/help';
import { useRentalStore } from '@/stores/rentalStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePeriodStore } from '@/stores/usePeriodStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { rentalClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { rentalCalculations } from '@/calculations/rental';
import { exportRentalYear } from '@/helpers/rental-export';
import { resolveRentalSettings } from '@/settings/rental';
import { isHouseholdReader, canEditHousehold } from '@/utils/household-role';
import { LoadableStatus } from '@/utils/loadable-status';
import type { RentalExpense, RentalIncomeEntry, RentalProperty } from '@/types/rental';
import { RentalContractBanner } from './rental-contract-banner';
import { RentalOverdueBanner } from './rental-overdue-banner';
import { RentalPropertiesTable } from './rental-properties-table';
import { RentalIncomeTable } from './rental-income-table';
import { RentalExpensesTable } from './rental-expenses-table';
import { RentalPropertyModal } from './rental-property-modal';
import { RentalIncomeModal } from './rental-income-modal';
import { RentalExpenseModal } from './rental-expense-modal';

export function RentalPage() {
  const user = useAuthStore((s) => s.user);
  const { selectedYear, selectedMonth } = usePeriodStore();
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();

  const properties = useRentalStore((s) => s.properties);
  const incomeEntries = useRentalStore((s) => s.incomeEntries);
  const expenses = useRentalStore((s) => s.expenses);
  const summary = useRentalStore((s) => s.summary);
  const upcomingContractEnds = useRentalStore((s) => s.upcomingContractEnds);
  const overdueRents = useRentalStore((s) => s.overdueRents);
  const status = useRentalStore((s) => s.status);

  const [propertyModal, setPropertyModal] = useState<RentalProperty | 'create' | null>(null);
  const [incomeModal, setIncomeModal] = useState<RentalIncomeEntry | 'create' | null>(null);
  const [expenseModal, setExpenseModal] = useState<RentalExpense | 'create' | null>(null);

  const settings = useMemo(() => resolveRentalSettings(user?.household), [user?.household]);
  const isReader = isHouseholdReader(user);
  const canEdit = canEditHousehold(user);
  const periodLabel = rentalCalculations.periodLabel(selectedMonth, selectedYear);

  const monthEntries = useMemo(
    () => rentalCalculations.entriesForMonth(incomeEntries, selectedYear, selectedMonth),
    [incomeEntries, selectedMonth, selectedYear],
  );

  const yearExpenses = useMemo(
    () => rentalCalculations.expensesForYear(expenses, selectedYear),
    [expenses, selectedYear],
  );

  const metrics = useMemo(
    () => rentalCalculations.buildMetricStrip(summary, settings.default_currency),
    [summary, settings.default_currency],
  );

  const refresh = useCallback(() => {
    void useRentalStore.getState().fetch(selectedYear, selectedMonth, true);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    void useRentalStore.getState().fetch(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const handleDeleteProperty = useCallback(
    async (p: RentalProperty) => {
      const res = await rentalClient.deleteProperty(p.id);
      if (!res || res[0] !== StatusCodes.Http200) {
        addNotification('A törlés nem sikerült.', 'error');
        return;
      }
      useRentalStore.getState().removeProperty(p.id);
      refresh();
      addNotification('Ingatlan törölve.', 'success');
    },
    [addNotification, refresh],
  );

  const handleDeleteIncome = useCallback(
    async (e: RentalIncomeEntry) => {
      const ok = await rentalClient.deleteIncome(e.id);
      if (!ok) {
        addNotification('A törlés nem sikerült.', 'error');
        return;
      }
      useRentalStore.getState().removeIncome(e.id);
      refresh();
      addNotification('Bevétel törölve.', 'success');
    },
    [addNotification, refresh],
  );

  const handleDeleteExpense = useCallback(
    async (e: RentalExpense) => {
      const ok = await rentalClient.deleteExpense(e.id);
      if (!ok) {
        addNotification('A törlés nem sikerült.', 'error');
        return;
      }
      useRentalStore.getState().removeExpense(e.id);
      refresh();
      addNotification('Költség törölve.', 'success');
    },
    [addNotification, refresh],
  );

  const handleExport = () => {
    exportRentalYear(properties, incomeEntries, selectedYear);
    addNotification(`${selectedYear}. évi export letöltve (CSV).`, 'success');
  };

  const isInitialLoad = status === LoadableStatus.Loading && properties.length === 0;
  if (isInitialLoad) {
    return <ModulePageSkeleton />;
  }

  const modalProperty = propertyModal && propertyModal !== 'create' ? propertyModal : null;
  const modalIncome = incomeModal && incomeModal !== 'create' ? incomeModal : null;
  const modalExpense = expenseModal && expenseModal !== 'create' ? expenseModal : null;

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Család' }, { label: 'Bérbeadás' }]}
        title="Bérbeadás"
        description="Bérbe adott ingatlanok: bérleti díj, esedékesség, befizetés, szerződés és tulajdonosi költségek."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExport}>
              <Download size={14} />
              Export ({selectedYear})
            </Button>
            {canEdit ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => setPropertyModal('create')}>
                  <Building2 size={14} />
                  Új ingatlan
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setExpenseModal('create')}>
                  <Wrench size={14} />
                  Költség
                </Button>
                <Button type="button" size="sm" onClick={() => setIncomeModal('create')}>
                  <Plus size={14} />
                  Bevétel ({periodLabel})
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <RentalOverdueBanner items={overdueRents} graceDays={settings.overdue_grace_days} />

      <RentalContractBanner
        items={upcomingContractEnds}
        reminderDays={settings.contract_reminder_days_before}
      />

      <MetricStrip items={metrics} columns={4} variant="separated" />

      <SectionPanel title="Ingatlanok" className="shadow-soft">
        <RentalPropertiesTable
          properties={properties}
          isReader={isReader}
          onEdit={(p) => setPropertyModal(p)}
          requestDelete={requestDelete}
          onDelete={handleDeleteProperty}
        />
      </SectionPanel>

      <SectionPanel
        title={`Havi bevételek · ${periodLabel}`}
        description={HELP.settings.rentalIncome}
        className="shadow-soft"
      >
        <RentalIncomeTable
          entries={monthEntries}
          properties={properties}
          isReader={isReader}
          onEdit={(e) => setIncomeModal(e)}
          requestDelete={requestDelete}
          onDelete={handleDeleteIncome}
        />
      </SectionPanel>

      <SectionPanel
        title={`Tulajdonosi költségek · ${selectedYear}`}
        description={HELP.settings.rentalExpense}
        className="shadow-soft"
      >
        <RentalExpensesTable
          expenses={yearExpenses}
          properties={properties}
          isReader={isReader}
          onEdit={(e) => setExpenseModal(e)}
          requestDelete={requestDelete}
          onDelete={handleDeleteExpense}
        />
      </SectionPanel>

      <RentalPropertyModal
        open={propertyModal !== null}
        property={modalProperty}
        onClose={() => setPropertyModal(null)}
        onSaved={() => {
          refresh();
          addNotification(
            propertyModal === 'create' ? 'Ingatlan létrehozva.' : 'Ingatlan frissítve.',
            'success',
          );
        }}
      />

      <RentalIncomeModal
        open={incomeModal !== null}
        entry={modalIncome}
        properties={properties}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onClose={() => setIncomeModal(null)}
        onSaved={() => {
          refresh();
          addNotification(
            incomeModal === 'create' ? 'Bevétel rögzítve.' : 'Bevétel frissítve.',
            'success',
          );
        }}
      />

      <RentalExpenseModal
        open={expenseModal !== null}
        expense={modalExpense}
        properties={properties}
        onClose={() => setExpenseModal(null)}
        onSaved={() => {
          refresh();
          addNotification(
            expenseModal === 'create' ? 'Költség rögzítve.' : 'Költség frissítve.',
            'success',
          );
        }}
      />

      <ConfirmDeleteModal />
    </div>
  );
}
