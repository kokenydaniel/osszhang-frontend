'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/config/help';
import { savingsCalculations } from '@/calculations/savings';
import { ModalFormFooter } from '@/components/design';
import type { Investment } from '@/types';
import type { SavingsSettings } from '@/settings/savings';
import { OwnerSelector } from './new-asset-modal';

type SavingsInvestmentEditModalProps = {
  investment: Investment | null;
  savingsSettings: SavingsSettings;
  onClose: () => void;
  onSave: (id: number, data: Partial<Omit<Investment, 'id'>>) => Promise<void>;
  saving?: boolean;
};

export function SavingsInvestmentEditModal({
  investment,
  savingsSettings,
  onClose,
  onSave,
  saving = false,
}: SavingsInvestmentEditModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('bond');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [owner, setOwner] = useState('');
  const [maturityValue, setMaturityValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [nextPayoutAmount, setNextPayoutAmount] = useState('');
  const [nextPayoutDate, setNextPayoutDate] = useState('');

  useEffect(() => {
    if (!investment) return;
    setName(investment.name);
    setType(investment.type);
    setPrincipal(String(investment.principalAmount));
    setRate(String(investment.annualInterestRate));
    setPurchaseDate(investment.purchaseDate);
    setMaturityDate(investment.maturityDate ?? '');
    setOwner(investment.owner);
    setMaturityValue(() => {
      const amount = savingsCalculations.readExplicitMaturityAmount(investment);
      return amount != null ? String(amount) : '';
    });
    setCurrentValue(investment.currentValue != null ? String(investment.currentValue) : '');
    setNextPayoutAmount(investment.nextPayoutAmount != null ? String(investment.nextPayoutAmount) : '');
    setNextPayoutDate(investment.nextPayoutDate ?? '');
  }, [investment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investment) return;

    const principalNum = Number(principal);
    const maturityNum = maturityValue.trim() ? Number(maturityValue) : 0;
    const finalRate = savingsCalculations.deriveAnnualRateFromMaturity(
      principalNum,
      maturityNum,
      purchaseDate,
      maturityDate,
      Number(rate) || 0,
    );

    await onSave(investment.id, {
      name: name.trim(),
      type,
      principalAmount: principalNum,
      annualInterestRate: Math.max(0, finalRate),
      purchaseDate,
      maturityDate: maturityDate || null,
      owner,
      maturityAmount: maturityNum > 0 ? maturityNum : null,
      currentValue: currentValue.trim() ? Number(currentValue) : null,
      nextPayoutAmount: nextPayoutAmount.trim() ? Number(nextPayoutAmount) : null,
      nextPayoutDate: nextPayoutDate || null,
    });
  };

  return (
    <Modal isOpen={!!investment} onClose={onClose} title="Befektetés szerkesztése" size="md">
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.savings.invName}>Megnevezés</FieldLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.savings.invType}>Típus</FieldLabel>
            <select
              className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="bond">Állampapír</option>
              <option value="stock">Részvény</option>
              <option value="other">Egyéb</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.savings.owner}>Tulajdonos</FieldLabel>
            <OwnerSelector owners={savingsSettings.owners} value={owner} onChange={setOwner} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.savings.principal}>Tőke (Ft)</FieldLabel>
            <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.savings.maturityAmount}>Lejárati névérték (Ft)</FieldLabel>
            <Input type="number" value={maturityValue} onChange={(e) => setMaturityValue(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.savings.invRate}>Éves kamat / hozam (%)</FieldLabel>
            <Input
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required={!maturityValue}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>MÁK / aktuális érték (Ft)</FieldLabel>
            <Input type="number" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.savings.purchaseDate}>Vásárlás dátuma</FieldLabel>
            <DatePicker value={purchaseDate} onChange={setPurchaseDate} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.savings.maturityDate}>Lejárat</FieldLabel>
            <DatePicker value={maturityDate} onChange={setMaturityDate} />
          </div>
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2.5">
          <FieldLabel info={HELP.savings.payoutAmount}>Kamatkifizetés (opcionális)</FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="Összeg"
              value={nextPayoutAmount}
              onChange={(e) => setNextPayoutAmount(e.target.value)}
            />
            <DatePicker value={nextPayoutDate} onChange={setNextPayoutDate} />
          </div>
        </div>
        <ModalFormFooter onCancel={onClose} submitLabel="Mentés" loading={saving} />
      </form>
    </Modal>
  );
}
