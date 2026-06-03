'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { HELP } from '@/config/help';
import { today as todayIso } from '@/utils/dates';
import { budgetClient } from '@/lib/api-client';
import { getActiveWalletId } from '@/helpers/wallet';
import { resolveDefaultCurrency } from '@/settings/budget';
import { useAuthStore } from '@/stores/useAuthStore';
import { StatusCodes } from '@/types/api';
import { aiHelpers } from '@/helpers/ai-helpers';
import type { CashTransaction } from '@/types';
import {
  BudgetTransactionForm,
  type BudgetTransactionFormValues,
} from './budget-transaction-form';

function valuesFromTransaction(tx: CashTransaction): BudgetTransactionFormValues {
  return {
    txType: tx.type,
    txCat: tx.category,
    txDesc: tx.description,
    txAmount: tx.amount.toString(),
    txCurrency: tx.currency ?? 'HUF',
    txDue: tx.dueDate,
    txIsBudget: tx.isBudget || false,
    txIsReserve: tx.isReserve || false,
  };
}

function emptyValues(
  categories: string[],
  defaultType: 'income' | 'expense',
  defaultCurrency: ReturnType<typeof resolveDefaultCurrency>,
): BudgetTransactionFormValues {
  return {
    txType: defaultType,
    txCat: categories[0] || '',
    txDesc: '',
    txAmount: '',
    txCurrency: defaultCurrency,
    txDue: todayIso(),
    txIsBudget: false,
    txIsReserve: false,
  };
}

export type BudgetTxModalTarget =
  | { mode: 'create'; defaultType?: 'income' | 'expense' }
  | { mode: 'edit'; transaction: CashTransaction };

type BudgetTransactionModalProps = {
  open: boolean;
  target: BudgetTxModalTarget | null;
  categories: string[];
  onClose: () => void;
  onSaved: (tx: CashTransaction, mode: 'create' | 'update') => void;
};

export function BudgetTransactionModal({
  open,
  target,
  categories,
  onClose,
  onSaved,
}: BudgetTransactionModalProps) {
  const household = useAuthStore((s) => s.user?.household);
  const defaultCurrency = resolveDefaultCurrency(household);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const isEdit = target?.mode === 'edit';
  const editTx = isEdit ? target.transaction : null;

  const form = useForm<BudgetTransactionFormValues>({
    defaultValues: emptyValues(categories, 'expense', defaultCurrency),
  });

  const txType = form.watch('txType');
  const txIsBudget = form.watch('txIsBudget');
  const txIsReserve = form.watch('txIsReserve');

  useEffect(() => {
    if (!open || !target) return;
    if (target.mode === 'edit') {
      form.reset(valuesFromTransaction(target.transaction));
    } else {
      form.reset(emptyValues(categories, target.defaultType ?? 'expense', defaultCurrency));
    }
  }, [open, target, categories, defaultCurrency, form]);

  const handleAutoCategory = async () => {
    const desc = form.getValues('txDesc').trim();
    if (!desc) return;
    setIsCategoryLoading(true);
    try {
      const category = await aiHelpers.autoCategorizeTransaction({
        description: desc,
        type: form.getValues('txType'),
        amount: form.getValues('txAmount') ? Number(form.getValues('txAmount')) : undefined,
        candidate_categories: categories,
      });
      if (category) form.setValue('txCat', category);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const submit = form.handleSubmit(async (values) => {
    const cleanAmount = values.txAmount.replace(',', '.');
    const walletId = getActiveWalletId() ?? undefined;
    const data = {
      type: values.txType,
      description: values.txDesc,
      category: values.txCat,
      amount: Number(cleanAmount),
      currency: values.txCurrency || 'HUF',
      dueDate: values.txDue,
      isBudget: values.txIsBudget,
      isReserve: values.txIsReserve,
      paidDate: editTx?.paidDate ?? null,
      walletId,
    };

    if (isEdit && editTx) {
      const res = await budgetClient.update(editTx.id as number, data);
      if (!res || res[0] !== StatusCodes.Http200) {
        form.setError('root', { message: 'A tétel mentése nem sikerült.' });
        return;
      }
      onSaved(res[1], 'update');
      onClose();
      return;
    }

    const res = await budgetClient.create(data);
    if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
      form.setError('root', { message: 'A tétel mentése nem sikerült.' });
      return;
    }
    onSaved(res[1], 'create');
    onClose();
  });

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Tétel szerkesztése' : 'Új tétel'}
      description={HELP.budget.txTypeIntro}
      contentKey={`${txType}-${txIsBudget}-${txIsReserve}`}
    >
      <BudgetTransactionForm
        form={form}
        categories={categories}
        isEdit={isEdit}
        isCategoryLoading={isCategoryLoading}
        onAutoCategory={() => void handleAutoCategory()}
        onCancel={onClose}
        onSubmit={submit}
      />
    </Modal>
  );
}
