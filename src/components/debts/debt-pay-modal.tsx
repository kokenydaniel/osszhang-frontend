'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { formatHUF } from '@/utils';
import { today } from '@/utils/dates';
import { Modal } from '@/components/ui/Modal';
import { budgetClient, debtsClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { debtsCalculations } from '@/calculations/debts';
import { buildDebtPayRecordUpdate } from '@/helpers/debt-installment-payments';
import { matchPaymentCategory, resolveDebtsSettings } from '@/settings/debts';
import type { Debt, UserProfile } from '@/types';
import { DebtPayForm, type DebtPayFormValues } from './debt-pay-form';

type DebtPayModalProps = {
  open: boolean;
  debt: Debt | null;
  walletId: number | null;
  user: UserProfile | null;
  categories: string[];
  selectedYear: number;
  selectedMonth: number;
  onClose: () => void;
  onPaid: (debt: Debt, payAddToBudget: boolean) => void;
};

export function DebtPayModal({
  open,
  debt,
  walletId,
  user,
  categories,
  selectedYear,
  selectedMonth,
  onClose,
  onPaid,
}: DebtPayModalProps) {
  const debtsSettings = useMemo(() => resolveDebtsSettings(user?.household), [user?.household]);

  const defaultCategory = useMemo(() => {
    if (categories.length === 0) return '';
    return matchPaymentCategory(categories, debtsSettings.payment_category_pattern);
  }, [categories, debtsSettings.payment_category_pattern]);

  const form = useForm<DebtPayFormValues>({
    defaultValues: {
      payAmount: '',
      payDate: today(),
      payNote: '',
      payAddToBudget: debtsSettings.pay_add_to_budget_default,
      payCategory: defaultCategory,
    },
  });

  useEffect(() => {
    if (!open || !debt) return;
    form.reset({
      payAmount: debt.minimumPayment ? String(debt.minimumPayment) : '',
      payDate: today(),
      payNote: `${debt.name} törlesztés`,
      payAddToBudget: debtsSettings.pay_add_to_budget_default,
      payCategory: defaultCategory,
    });
  }, [open, debt, debtsSettings.pay_add_to_budget_default, defaultCategory, form]);

  const submit = form.handleSubmit(async (values) => {
    if (!debt) return;

    const amt = debtsCalculations.parsePaymentAmount(values.payAmount);
    if (!amt) {
      form.setError('payAmount', { message: 'A törlesztés összege legalább 1 Ft kell legyen.' });
      return;
    }

    const resUpdate = await debtsClient.update(
      debt.id,
      buildDebtPayRecordUpdate(
        debt,
        selectedYear,
        selectedMonth,
        amt,
        values.payDate,
        values.payAddToBudget || !!debt.budgetSyncEnabled,
      ),
    );
    if (!resUpdate || resUpdate[0] !== StatusCodes.Http200) {
      form.setError('root', { message: 'Nem sikerült rögzíteni a törlesztést.' });
      return;
    }

    if (values.payAddToBudget && values.payCategory) {
      const resBudget = await budgetClient.create({
        type: 'expense',
        description: values.payNote || `${debt.name} törlesztés`,
        category: values.payCategory,
        amount: amt,
        dueDate: values.payDate,
        paidDate: values.payDate,
        isBudget: false,
        isReserve: false,
        walletId: walletId ?? undefined,
      });
      if (!resBudget || (resBudget[0] !== StatusCodes.Http200 && resBudget[0] !== StatusCodes.Http201)) {
        form.setError('root', { message: 'A tartozás frissült, de a költségvetés rögzítése nem sikerült.' });
        return;
      }
    }

    onPaid(resUpdate[1], values.payAddToBudget);
    onClose();
  });

  if (!debt) return null;

  const remaining = debtsCalculations.remaining(debt);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Törlesztés rögzítése"
      description={`${debt.name} · ${formatHUF(remaining)} van hátra`}
    >
      <DebtPayForm
        form={form}
        debt={debt}
        categories={categories}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onCancel={onClose}
        onSubmit={submit}
      />
    </Modal>
  );
}
