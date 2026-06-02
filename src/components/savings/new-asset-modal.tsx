'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/config/help';
import { today, toDayjs } from '@/utils/dates';
import { SegmentedControl, ModalFormFooter } from '@/components/design';
import { Target, TrendingUp, Wallet } from 'lucide-react';
import type { Investment } from '@/types';
import type { CreateSavingsPayload } from '@/types';
import type { SavingsSettings } from '@/settings/savings';

type AssetKind = 'account' | 'goal' | 'investment';

// ─── Props for the Smart Wrapper ──────────────────────────────────────────────

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKind?: AssetKind;
  /** Called from savings-page after API create */
  onAddSavingsAccount: (payload: CreateSavingsPayload) => Promise<void>;
  onAddInvestment: (data: Omit<Investment, 'id'>) => Promise<void>;
  savingsSettings: SavingsSettings;
  saving?: boolean;
}

// ─── Smart Wrapper ────────────────────────────────────────────────────────────

/**
 * NewAssetModal — Smart Wrapper.
 *
 * Manages tab state and delegates to pure Dumb form components.
 * Reads open/close state and settings from props (injected by savings-page).
 * Does NOT import any store or context — it is fully controlled externally.
 */
export function NewAssetModal({
  isOpen,
  onClose,
  initialKind = 'account',
  onAddSavingsAccount,
  onAddInvestment,
  savingsSettings,
  saving = false,
}: NewAssetModalProps) {
  const [kind, setKind] = useState<AssetKind>(initialKind);

  useEffect(() => {
    if (isOpen) setKind(initialKind);
  }, [isOpen, initialKind]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Új megtakarítás"
      description="Számla, cél vagy állampapír — válaszd ki, mit szeretnél rögzíteni."
      size={kind === 'investment' ? 'lg' : 'md'}
      contentKey={kind}
    >
      <SegmentedControl
        variant="choice"
        value={kind}
        onChange={(v) => setKind(v as AssetKind)}
        options={[
          { value: 'account', label: 'Számla', icon: Wallet, tone: 'primary', description: 'Revolut, készpénz, bankszámla' },
          { value: 'goal', label: 'Cél', icon: Target, tone: 'accent', description: 'Célösszeg, határidő, progress' },
          { value: 'investment', label: 'Állampapír', icon: TrendingUp, tone: 'positive', description: 'PMÁP, DKJ, befektetés' },
        ]}
        className="mb-4"
        animated={false}
      />

      {kind === 'account' && (
        <NewAccountForm
          savingsSettings={savingsSettings}
          onSubmit={onAddSavingsAccount}
          onCancel={onClose}
          saving={saving}
        />
      )}
      {kind === 'goal' && (
        <NewGoalForm
          onSubmit={onAddSavingsAccount}
          onCancel={onClose}
          saving={saving}
        />
      )}
      {kind === 'investment' && (
        <NewInvestmentForm
          savingsSettings={savingsSettings}
          onSubmit={onAddInvestment}
          onCancel={onClose}
          saving={saving}
        />
      )}
    </Modal>
  );
}

// ─── Dumb Form: New Account ───────────────────────────────────────────────────

interface NewAccountFormProps {
  savingsSettings: SavingsSettings;
  onSubmit: (payload: CreateSavingsPayload) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

function NewAccountForm({ savingsSettings, onSubmit, onCancel, saving }: NewAccountFormProps) {
  const [institution, setInstitution] = useState('');
  const [currency, setCurrency] = useState(savingsSettings.currencies[0] ?? 'HUF');
  const [owner, setOwner] = useState(savingsSettings.default_owner);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ type: 'account', institution, currency, owner, count_in_savings: savingsSettings.default_count_in_savings });
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <FieldLabel info={HELP.savings.accountName}>Intézmény / Megnevezés</FieldLabel>
        <Input placeholder="pl. Revolut, Széf, OTP" value={institution} onChange={(e) => setInstitution(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.savings.currency}>Pénznem</FieldLabel>
          <select
            className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {savingsSettings.currencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.savings.owner}>Tulajdonos</FieldLabel>
          <OwnerSelector owners={savingsSettings.owners} value={owner} onChange={setOwner} />
        </div>
      </div>
      <ModalFormFooter onCancel={onCancel} submitLabel="Számla létrehozása" loading={saving} />
    </form>
  );
}

// ─── Dumb Form: New Goal ──────────────────────────────────────────────────────

interface NewGoalFormProps {
  onSubmit: (payload: CreateSavingsPayload) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

function NewGoalForm({ onSubmit, onCancel, saving }: NewGoalFormProps) {
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState(toDayjs().add(6, 'month').format('YYYY-MM-DD'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      type: 'goal',
      institution: goalName,
      goalAmount: Number(goalAmount),
      currentAmount: Number(currentAmount) || 0,
      targetDate,
    });
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <FieldLabel info={HELP.savings.accountName}>Cél neve</FieldLabel>
        <Input placeholder="pl. Nyaralás, Vésztartalék, Autó" value={goalName} onChange={(e) => setGoalName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.savings.principal}>Célösszeg (Ft)</FieldLabel>
          <Input type="number" min={1} placeholder="500000" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <FieldLabel hint="Ami már félretettél">Jelenlegi összeg (Ft)</FieldLabel>
          <Input type="number" min={0} placeholder="0" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <FieldLabel info={HELP.savings.maturityDate}>Cél határideje</FieldLabel>
        <DatePicker value={targetDate} onChange={setTargetDate} />
      </div>
      <ModalFormFooter onCancel={onCancel} submitLabel="Cél létrehozása" loading={saving} />
    </form>
  );
}

// ─── Dumb Form: New Investment ────────────────────────────────────────────────

interface NewInvestmentFormProps {
  savingsSettings: SavingsSettings;
  onSubmit: (data: Omit<Investment, 'id'>) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

function NewInvestmentForm({ savingsSettings, onSubmit, onCancel, saving }: NewInvestmentFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('bond');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [maturityDate, setMaturityDate] = useState('');
  const [owner, setOwner] = useState(savingsSettings.default_owner);
  const [maturityValue, setMaturityValue] = useState('');
  const [nextPayoutAmount, setNextPayoutAmount] = useState('');
  const [nextPayoutDate, setNextPayoutDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalRate = Number(rate);
    if (maturityValue && Number(maturityValue) > 0 && maturityDate && purchaseDate) {
      const pDate = toDayjs(purchaseDate);
      const mDate = toDayjs(maturityDate);
      const diffDays = Math.ceil(Math.max(0, mDate.diff(pDate, 'day')));
      if (diffDays > 0) {
        const totalReturnRatio = (Number(maturityValue) - Number(principal)) / Number(principal);
        finalRate = Math.round(totalReturnRatio * (365.25 / diffDays) * 100 * 100) / 100;
      }
    }
    await onSubmit({
      name,
      type,
      principalAmount: Number(principal),
      annualInterestRate: finalRate,
      purchaseDate,
      maturityDate: maturityDate || null,
      owner,
      countInSavings: savingsSettings.default_count_in_savings,
      maturityAmount: maturityValue ? Number(maturityValue) : null,
      nextPayoutAmount: nextPayoutAmount ? Number(nextPayoutAmount) : null,
      nextPayoutDate: nextPayoutDate || null,
    });
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <FieldLabel info={HELP.savings.invName}>Megnevezés</FieldLabel>
        <Input placeholder="pl. PMÁP 2032/J, DKJ D260722" value={name} onChange={(e) => setName(e.target.value)} required />
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
          <Input type="number" placeholder="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.savings.maturityAmount}>Lejárati érték (Ft)</FieldLabel>
          <Input type="number" placeholder="pl. 7 000 000" value={maturityValue} onChange={(e) => setMaturityValue(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <FieldLabel info={HELP.savings.invRate}>Éves kamat / hozam (%)</FieldLabel>
        <Input type="number" step="0.01" placeholder="pl. 5.15" value={rate} onChange={(e) => setRate(e.target.value)} required={!maturityValue} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <FieldLabel info={HELP.savings.purchaseDate}>Vásárlás dátuma</FieldLabel>
          <DatePicker value={purchaseDate} onChange={setPurchaseDate} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel info={HELP.savings.maturityDate}>Lejárat (opcionális)</FieldLabel>
          <DatePicker value={maturityDate} onChange={setMaturityDate} />
        </div>
      </div>
      <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2.5">
        <FieldLabel info={HELP.savings.payoutAmount}>Kamatkifizetés (opcionális · pl. FixMÁP)</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.savings.payoutAmount}>Összeg (Ft)</FieldLabel>
            <Input type="number" placeholder="pl. 72 630" value={nextPayoutAmount} onChange={(e) => setNextPayoutAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.savings.payoutDate}>Dátum</FieldLabel>
            <DatePicker value={nextPayoutDate} onChange={setNextPayoutDate} />
          </div>
        </div>
      </div>
      <ModalFormFooter onCancel={onCancel} submitLabel="Létrehozás" loading={saving} />
    </form>
  );
}

// ─── Shared: Owner Selector ────────────────────────────────────────────────────

interface OwnerSelectorProps {
  owners: string[];
  value: string;
  onChange: (v: string) => void;
}

export function OwnerSelector({ owners, value, onChange }: OwnerSelectorProps) {
  if (owners.length === 0) {
    return (
      <Input
        placeholder="Pl. Közös, Szandi…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    );
  }

  return (
    <>
      <select
        className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
        value={owners.includes(value) ? value : 'custom'}
        onChange={(e) => onChange(e.target.value === 'custom' ? '' : e.target.value)}
      >
        {owners.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value="custom">Egyedi…</option>
      </select>
      {!owners.includes(value) && (
        <Input
          placeholder="Pl. Szandi, Dani"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="mt-2"
        />
      )}
    </>
  );
}
