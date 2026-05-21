'use client';

import { Modal } from '@/components/ui/Modal';
import { ModalFormFooter } from '@/components/design';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FormField } from '@/components/ui/FormField';
import { HELP } from '@/lib/helpTexts';
import type { DebtsPageState } from '@/components/modules/debts/hooks/use-debts-page-state';

type DebtsFormModalProps = Pick<
  DebtsPageState,
  | 'isModalOpen'
  | 'setIsModalOpen'
  | 'editId'
  | 'name'
  | 'setName'
  | 'targetAmount'
  | 'setTargetAmount'
  | 'paidAmount'
  | 'setPaidAmount'
  | 'annualInterestRate'
  | 'setAnnualInterestRate'
  | 'minimumPayment'
  | 'setMinimumPayment'
  | 'dueDay'
  | 'setDueDay'
  | 'handleSubmit'
>;

export function DebtsFormModal({
  isModalOpen,
  setIsModalOpen,
  editId,
  name,
  setName,
  targetAmount,
  setTargetAmount,
  paidAmount,
  setPaidAmount,
  annualInterestRate,
  setAnnualInterestRate,
  minimumPayment,
  setMinimumPayment,
  dueDay,
  setDueDay,
  handleSubmit,
}: DebtsFormModalProps) {
  return (
    <Modal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title={editId ? 'Tartozás szerkesztése' : 'Új tartozás'}
      description="Add meg az aktuális hátralékot, kamatot és a havi részletet. Ezek alapján számítjuk a lejáratot."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.debts.name}>Megnevezés</FieldLabel>
          <Input
            placeholder="pl. Lakáshitel, Autóhitel, Hitelkártya"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.debts.targetAmount}>Eredeti összeg (Ft)</FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.debts.paidAmount}>Eddig törlesztve (Ft)</FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
          <FormField
            label="Éves kamat (%)"
            info={HELP.debts.interestRate}
            hint="A lejárat számításához kell — THM-hez közeli érték."
          >
            <Input
              type="number"
              step="0.01"
              placeholder="pl. 7.5"
              value={annualInterestRate}
              onChange={(e) => setAnnualInterestRate(e.target.value)}
            />
          </FormField>
          <FormField
            label="Havi részlet (Ft)"
            info={HELP.debts.minimumPayment}
            hint="A bank által előírt havi törlesztő — ha kisebb a kamatnál, a tartozás nem csökken."
          >
            <Input
              type="number"
              placeholder="0"
              value={minimumPayment}
              onChange={(e) => setMinimumPayment(e.target.value)}
            />
          </FormField>
          <FormField label="Esedékesség napja" info={HELP.debts.dueDay}>
            <Input
              type="number"
              min={1}
              max={31}
              placeholder="1-31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
            />
          </FormField>
        </div>
        <ModalFormFooter
          onCancel={() => setIsModalOpen(false)}
          submitLabel={editId ? 'Mentés' : 'Létrehozás'}
        />
      </form>
    </Modal>
  );
}
