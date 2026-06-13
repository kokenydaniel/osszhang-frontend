'use client';

import type { UseFormReturn } from 'react-hook-form';
import { ModalFormFooter } from '@/components/design';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FieldHint } from '@/components/ui/FieldHint';
import { FormChoiceCard } from '@/components/ui/FormChoiceCard';
import { HELP } from '@/config/help';
import { SegmentedControl } from '@/components/design';
import { TierGatedButton } from '@/components/subscription/TierGatedButton';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  PiggyBank,
  ReceiptText,
  RefreshCw,
  Wallet,
} from 'lucide-react';

export type BudgetTransactionFormValues = {
  txType: 'income' | 'expense';
  txCat: string;
  txDesc: string;
  txAmount: string;
  txCurrency: string;
  txDue: string;
  txIsBudget: boolean;
  txIsReserve: boolean;
};

type BudgetTransactionFormProps = {
  form: UseFormReturn<BudgetTransactionFormValues>;
  categories: string[];
  isEdit: boolean;
  isCategoryLoading: boolean;
  onAutoCategory: () => void;
  onCancel: () => void;
  onSubmit: ReturnType<UseFormReturn<BudgetTransactionFormValues>['handleSubmit']>;
};

export function BudgetTransactionForm({
  form,
  categories,
  isEdit,
  isCategoryLoading,
  onAutoCategory,
  onCancel,
  onSubmit,
}: BudgetTransactionFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const txType = watch('txType');
  const txIsBudget = watch('txIsBudget');
  const txIsReserve = watch('txIsReserve');
  const txDesc = watch('txDesc');
  const txCat = watch('txCat');
  const categoryOptions =
    txCat && !categories.includes(txCat) ? [...categories, txCat] : categories;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {errors.root?.message ? (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      ) : null}

      <SegmentedControl
        variant="choice"
        value={txType}
        onChange={(v) => {
          const next = v as 'income' | 'expense';
          setValue('txType', next);
          if (next === 'income') setValue('txIsBudget', false);
          else setValue('txIsReserve', false);
        }}
        options={[
          {
            value: 'income',
            label: 'Bevétel',
            icon: ArrowUpRight,
            tone: 'positive',
            description: 'Fizetés, visszatérítés, bevétel',
          },
          {
            value: 'expense',
            label: 'Kiadás',
            icon: ArrowDownRight,
            tone: 'negative',
            description: 'Költség, rezsi, vásárlás',
          },
        ]}
        animated={false}
      />

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">
          {txType === 'expense' ? 'Kiadás típusa' : 'Bevétel típusa'}
        </p>
        <FieldHint className="-mt-1 mb-1">
          {txType === 'expense'
            ? 'Normál kiadás = azonnal cashflow. Saját keret = előbb keret, költést később ledgerrel.'
            : 'Normál bevétel = növeli a költhető egyenleget. Tartalék = félretett összeg, nem cashflow.'}
        </FieldHint>
        {txType === 'expense' ? (
          <div className="grid gap-2" role="radiogroup" aria-label="Kiadás típusa">
            <FormChoiceCard
              selected={!txIsBudget}
              onSelect={() => setValue('txIsBudget', false)}
              title="Normál kiadás (cashflow)"
              description={HELP.budget.expenseNormal}
              example="Lidl, benzín, előfizetés"
              icon={ReceiptText}
            />
            <FormChoiceCard
              selected={txIsBudget}
              onSelect={() => setValue('txIsBudget', true)}
              title="Saját keret (ledger)"
              description={HELP.budget.expenseLedger}
              example="Heti bevásárlás 80 000 Ft keret"
              icon={Wallet}
            />
          </div>
        ) : (
          <div className="grid gap-2" role="radiogroup" aria-label="Bevétel típusa">
            <FormChoiceCard
              selected={!txIsReserve}
              onSelect={() => setValue('txIsReserve', false)}
              title="Bevétel (cashflow)"
              description={HELP.budget.incomeNormal}
              example="Fizetés, visszatérítés"
              icon={ArrowUpRight}
            />
            <FormChoiceCard
              selected={txIsReserve}
              onSelect={() => setValue('txIsReserve', true)}
              title="Tartalék"
              badge="Nem cashflow"
              description={HELP.budget.incomeReserve}
              example="Állampapírra félretett összeg ebben a hónapban"
              icon={PiggyBank}
              warning={HELP.budget.reserveWarning}
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <FieldLabel info={HELP.budget.description} hint="Rövid név — később is felismerhető legyen a listában.">
          Leírás
        </FieldLabel>
        <Input placeholder="pl. Heti bevásárlás" {...register('txDesc', { required: 'Kötelező mező' })} />
        {errors.txDesc ? <p className="text-xs text-destructive">{errors.txDesc.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <FieldLabel info={HELP.budget.category} hint="A kategória összesítőben és az AI elemzésben is megjelenik.">
          Kategória
        </FieldLabel>
        <div className="flex gap-2">
          <select
            className="h-9 flex-1 rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
            {...register('txCat', { required: true })}
            value={txCat}
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <TierGatedButton
            type="button"
            feature="ai"
            featureLabel="Automatikus kategorizálás"
            variant="outline"
            size="sm"
            onClick={onAutoCategory}
            disabled={isCategoryLoading || !txDesc.trim()}
          >
            {isCategoryLoading ? <RefreshCw size={13} className="animate-spin" /> : <Bot size={13} />}
            Auto
          </TierGatedButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <div className="space-y-1.5 min-w-0">
          <FieldLabel
            info={HELP.budget.amount}
            hint={
              txType === 'expense' && txIsBudget
                ? 'Ez a keret plafon — nem egyetlen azonnali kiadás.'
                : txType === 'income' && txIsReserve
                  ? 'Félretett összeg — nem növeli automatikusan a „Marad” mutatót.'
                  : undefined
            }
          >
            Összeg
          </FieldLabel>
          <Input
            type="number"
            placeholder="0"
            step="any"
            {...register('txAmount', { required: 'Kötelező mező' })}
          />
          {errors.txAmount ? <p className="text-xs text-destructive">{errors.txAmount.message}</p> : null}
        </div>
        <div className="space-y-1.5 min-w-0">
          <FieldLabel
            info="Mentés: az összeg EUR/USD-ben marad. A költségvetés számítás forintra vált élő árfolyamon."
          >
            Pénznem
          </FieldLabel>
          <select
            className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
            {...register('txCurrency')}
          >
            <option value="HUF">HUF</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.budget.date} hint="Esedékesség vagy a tranzakció napja.">
            Dátum
          </FieldLabel>
          <DatePicker
            value={watch('txDue')}
            onChange={(v) => setValue('txDue', v, { shouldValidate: true })}
          />
        </div>
      </div>

      <ModalFormFooter onCancel={onCancel} submitType="submit" loading={isSubmitting} />
    </form>
  );
}
