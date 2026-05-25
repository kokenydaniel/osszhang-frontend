'use client';

import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { ModalFormFooter } from '@/components/design';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FieldHint } from '@/components/ui/FieldHint';
import { FormChoiceCard } from '@/components/ui/FormChoiceCard';
import { HELP } from '@/lib/helpTexts';
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
import type { BudgetPageState } from '@/components/modules/budget/hooks/use-budget-page-state';

type BudgetTransactionModalProps = Pick<
  BudgetPageState,
  | 'isTxModalOpen'
  | 'setIsTxModalOpen'
  | 'editTxId'
  | 'txType'
  | 'setTxType'
  | 'txCat'
  | 'setTxCat'
  | 'txDesc'
  | 'setTxDesc'
  | 'txAmount'
  | 'setTxAmount'
  | 'txDue'
  | 'setTxDue'
  | 'txIsBudget'
  | 'setTxIsBudget'
  | 'txIsReserve'
  | 'setTxIsReserve'
  | 'handleTxSubmit'
  | 'handleAutoCategory'
  | 'isCategoryLoading'
  | 'categories'
>;

export function BudgetTransactionModal(props: BudgetTransactionModalProps) {
  const {
    isTxModalOpen,
    setIsTxModalOpen,
    editTxId,
    txType,
    setTxType,
    txCat,
    setTxCat,
    txDesc,
    setTxDesc,
    txAmount,
    setTxAmount,
    txDue,
    setTxDue,
    txIsBudget,
    setTxIsBudget,
    txIsReserve,
    setTxIsReserve,
    handleTxSubmit,
    handleAutoCategory,
    isCategoryLoading,
    categories,
  } = props;

  return (
    <Modal
      isOpen={isTxModalOpen}
      onClose={() => setIsTxModalOpen(false)}
      title={editTxId ? 'Tétel szerkesztése' : 'Új tétel'}
      description={HELP.budget.txTypeIntro}
      contentKey={`${txType}-${txIsBudget}-${txIsReserve}`}
    >
      <form onSubmit={handleTxSubmit} className="flex flex-col gap-4">
        <SegmentedControl
          variant="choice"
          value={txType}
          onChange={(v) => {
            const next = v as 'income' | 'expense';
            setTxType(next);
            if (next === 'income') setTxIsBudget(false);
            else setTxIsReserve(false);
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
                onSelect={() => setTxIsBudget(false)}
                title="Normál kiadás (cashflow)"
                description={HELP.budget.expenseNormal}
                example="Lidl, benzín, előfizetés"
                icon={ReceiptText}
              />
              <FormChoiceCard
                selected={txIsBudget}
                onSelect={() => setTxIsBudget(true)}
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
                onSelect={() => setTxIsReserve(false)}
                title="Bevétel (cashflow)"
                description={HELP.budget.incomeNormal}
                example="Fizetés, visszatérítés"
                icon={ArrowUpRight}
              />
              <FormChoiceCard
                selected={txIsReserve}
                onSelect={() => setTxIsReserve(true)}
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
          <Input
            placeholder="pl. Heti bevásárlás"
            value={txDesc}
            onChange={(e) => setTxDesc(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel info={HELP.budget.category} hint="A kategória összesítőben és az AI elemzésben is megjelenik.">
            Kategória
          </FieldLabel>
          <div className="flex gap-2">
            <select
              className="h-9 flex-1 rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
              value={txCat}
              onChange={(e) => setTxCat(e.target.value)}
            >
              {categories.map((c) => (
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
              onClick={handleAutoCategory}
              disabled={isCategoryLoading || !txDesc.trim()}
            >
              {isCategoryLoading ? <RefreshCw size={13} className="animate-spin" /> : <Bot size={13} />}
              Auto
            </TierGatedButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
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
              Összeg (Ft)
            </FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              required
              step="any"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.budget.date} hint="Esedékesség vagy a tranzakció napja.">
              Dátum
            </FieldLabel>
            <DatePicker value={txDue} onChange={setTxDue} />
          </div>
        </div>

        <ModalFormFooter onCancel={() => setIsTxModalOpen(false)} />
      </form>
    </Modal>
  );
}
