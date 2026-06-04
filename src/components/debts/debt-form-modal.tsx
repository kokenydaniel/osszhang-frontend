'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { debtsClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { debtsCalculations } from '@/calculations/debts';
import type { Debt } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { resolveDebtsSettings } from '@/settings/debts';
import { DebtForm, type DebtFormValues } from './debt-form';

const currentMonthValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

function emptyValues(): DebtFormValues {
  const settings = resolveDebtsSettings(useAuthStore.getState().user?.household);
  return {
    name: '',
    targetAmount: '',
    paidAmount: '0',
    annualInterestRate: settings.default_interest_rate_annual
      ? String(settings.default_interest_rate_annual)
      : '',
    minimumPayment: '',
    dueDay: '',
    budgetSyncEnabled: settings.pay_add_to_budget_default,
    budgetStartMonth: currentMonthValue(),
  };
}

function valuesFromDebt(debt: Debt): DebtFormValues {
  const start =
    debt.budgetStartYear && debt.budgetStartMonth
      ? `${debt.budgetStartYear}-${String(debt.budgetStartMonth).padStart(2, '0')}`
      : currentMonthValue();
  return {
    name: debt.name,
    targetAmount: String(debt.targetAmount),
    paidAmount: String(debt.paidAmount),
    annualInterestRate: debt.annualInterestRate ? String(debt.annualInterestRate) : '',
    minimumPayment: debt.minimumPayment ? String(debt.minimumPayment) : '',
    dueDay: debt.dueDay ? String(debt.dueDay) : '',
    budgetSyncEnabled: debt.budgetSyncEnabled ?? false,
    budgetStartMonth: start,
  };
}

type DebtFormModalProps = {
  open: boolean;
  debt: Debt | null;
  walletId: number | null;
  onClose: () => void;
  onSaved: (debt: Debt, mode: 'create' | 'update') => void;
};

export function DebtFormModal({ open, debt, walletId, onClose, onSaved }: DebtFormModalProps) {
  const form = useForm<DebtFormValues>({ defaultValues: emptyValues() });
  const isEdit = debt !== null;

  useEffect(() => {
    if (!open) return;
    form.reset(debt ? valuesFromDebt(debt) : emptyValues());
  }, [open, debt, form]);

  const submit = form.handleSubmit(async (values) => {
    const payload = debtsCalculations.buildDebtFormPayload(values);

    if (isEdit && debt) {
      const res = await debtsClient.update(debt.id, {
        ...payload,
        paidInstallmentMonths: debt.paidInstallmentMonths,
      });
      if (!res || res[0] !== StatusCodes.Http200) {
        form.setError('root', { message: 'A tartozás mentése nem sikerült.' });
        return;
      }
      onSaved(res[1], 'update');
      onClose();
      return;
    }

    if (!walletId) {
      form.setError('root', { message: 'Válassz pénztárcát a mentéshez.' });
      return;
    }

    const res = await debtsClient.create({ ...payload, walletId });
    if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
      form.setError('root', { message: 'A tartozás mentése nem sikerült.' });
      return;
    }
    onSaved(res[1], 'create');
    onClose();
  });

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Tartozás szerkesztése' : 'Új tartozás'}
      description="Add meg az aktuális hátralékot, kamatot és a havi részletet. Ezek alapján számítjuk a lejáratot."
    >
      <DebtForm
        form={form}
        isEdit={isEdit}
        onCancel={onClose}
        onSubmit={submit}
        typeTemplates={resolveDebtsSettings(useAuthStore.getState().user?.household).debt_type_templates}
      />
      {!isEdit ? (
        <p className="text-xs text-muted-foreground mt-3">
          Dokumentumok (szerződés, hitelkérelem stb.) a mentés után a táblázat „Dokumentum” oszlopából
          érhetők el.
        </p>
      ) : null}
    </Modal>
  );
}
