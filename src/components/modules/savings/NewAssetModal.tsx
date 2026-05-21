'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { resolveSavingsSettings } from '@/lib/savingsSettings';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import { today, d } from '@/lib/dates';
import { SegmentedControl, ModalFormFooter } from '@/components/design';
import { Wallet, TrendingUp } from 'lucide-react';

type AssetKind = 'account' | 'investment';

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKind?: AssetKind;
}

export function NewAssetModal({ isOpen, onClose, initialKind = 'account' }: NewAssetModalProps) {
  const { addSavingsAccount, addInvestment } = useSavingsStore();
  const { user } = useAuthStore();
  const savingsSettings = useMemo(() => resolveSavingsSettings(user?.household), [user?.household]);

  const [kind, setKind] = useState<AssetKind>(initialKind);

  const [savInst, setSavInst] = useState('');
  const [savCurr, setSavCurr] = useState(savingsSettings.currencies[0] ?? 'HUF');
  const [savOwner, setSavOwner] = useState(savingsSettings.default_owner);

  const [invName, setInvName] = useState('');
  const [invType, setInvType] = useState('bond');
  const [invPrincipal, setInvPrincipal] = useState('');
  const [invRate, setInvRate] = useState('');
  const [invPurchaseDate, setInvPurchaseDate] = useState(today());
  const [invMaturityDate, setInvMaturityDate] = useState('');
  const [invOwner, setInvOwner] = useState(savingsSettings.default_owner);
  const [invMaturityValue, setInvMaturityValue] = useState('');
  const [invNextPayoutAmount, setInvNextPayoutAmount] = useState('');
  const [invNextPayoutDate, setInvNextPayoutDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setKind(initialKind);
      setSavCurr(savingsSettings.currencies[0] ?? 'HUF');
      setSavOwner(savingsSettings.default_owner);
      setInvOwner(savingsSettings.default_owner);
    }
  }, [isOpen, initialKind, savingsSettings]);

  const resetAndClose = () => {
    onClose();
    setSavInst('');
    setSavCurr(savingsSettings.currencies[0] ?? 'HUF');
    setSavOwner(savingsSettings.default_owner);
    setInvName('');
    setInvType('bond');
    setInvPrincipal('');
    setInvRate('');
    setInvPurchaseDate(today());
    setInvMaturityDate('');
    setInvOwner(savingsSettings.default_owner);
    setInvMaturityValue('');
    setInvNextPayoutAmount('');
    setInvNextPayoutDate('');
  };

  const handleSavingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSavingsAccount({
      institution: savInst,
      currency: savCurr,
      owner: savOwner,
      count_in_savings: savingsSettings.default_count_in_savings,
    });
    resetAndClose();
  };

  const handleInvestmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalRate = Number(invRate);
    if (invMaturityValue && Number(invMaturityValue) > 0 && invMaturityDate && invPurchaseDate) {
      const pDate = d(invPurchaseDate);
      const mDate = d(invMaturityDate);
      const diffDays = Math.ceil(Math.max(0, mDate.diff(pDate, 'day')));
      if (diffDays > 0) {
        const totalReturnRatio = (Number(invMaturityValue) - Number(invPrincipal)) / Number(invPrincipal);
        finalRate = Math.round(totalReturnRatio * (365.25 / diffDays) * 100 * 100) / 100;
      }
    }
    addInvestment({
      name: invName,
      type: invType,
      principalAmount: Number(invPrincipal),
      annualInterestRate: finalRate,
      purchaseDate: invPurchaseDate,
      maturityDate: invMaturityDate || null,
      owner: invOwner,
      countInSavings: savingsSettings.default_count_in_savings,
      maturityAmount: invMaturityValue ? Number(invMaturityValue) : null,
      nextPayoutAmount: invNextPayoutAmount ? Number(invNextPayoutAmount) : null,
      nextPayoutDate: invNextPayoutDate || null,
    });
    resetAndClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Új megtakarítás"
      description="Válaszd ki, számlát vagy állampapírt szeretnél rögzíteni."
      size={kind === 'investment' ? 'lg' : 'md'}
      contentKey={kind}
    >
      <SegmentedControl
        variant="choice"
        value={kind}
        onChange={(v) => setKind(v as AssetKind)}
        options={[
          {
            value: 'account',
            label: 'Számla',
            icon: Wallet,
            tone: 'primary',
            description: 'Bankszámla, Revolut, készpénz',
          },
          {
            value: 'investment',
            label: 'Állampapír',
            icon: TrendingUp,
            tone: 'accent',
            description: 'PMÁP, DKJ, befektetés',
          },
        ]}
        className="mb-4"
        animated={false}
      />

      {kind === 'account' ? (
        <form onSubmit={handleSavingsSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.savings.accountName}>Intézmény / Megnevezés</FieldLabel>
            <Input
              placeholder="pl. Revolut, Széf, OTP"
              value={savInst}
              onChange={(e) => setSavInst(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel info={HELP.savings.currency}>Pénznem</FieldLabel>
              <select
                className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                value={savCurr}
                onChange={(e) => setSavCurr(e.target.value)}
              >
                {savingsSettings.currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.savings.owner}>Tulajdonos</FieldLabel>
              {savingsSettings.owners.length > 0 ? (
                <>
                  <select
                    className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                    value={savingsSettings.owners.includes(savOwner) ? savOwner : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'custom') setSavOwner('');
                      else setSavOwner(e.target.value);
                    }}
                  >
                    {savingsSettings.owners.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                    <option value="custom">Egyedi…</option>
                  </select>
                  {!savingsSettings.owners.includes(savOwner) && (
                    <Input
                      placeholder="Pl. Szandi, Dani"
                      value={savOwner}
                      onChange={(e) => setSavOwner(e.target.value)}
                      required
                      className="mt-2"
                    />
                  )}
                </>
              ) : (
                <Input
                  placeholder="Pl. Közös, Szandi…"
                  value={savOwner}
                  onChange={(e) => setSavOwner(e.target.value)}
                  required
                />
              )}
            </div>
          </div>
          <ModalFormFooter onCancel={resetAndClose} submitLabel="Létrehozás" />
        </form>
      ) : (
        <form onSubmit={handleInvestmentSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <FieldLabel info={HELP.savings.invName}>Megnevezés</FieldLabel>
            <Input
              placeholder="pl. PMÁP 2032/J, DKJ D260722"
              value={invName}
              onChange={(e) => setInvName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel info={HELP.savings.invType}>Típus</FieldLabel>
              <select
                className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                value={invType}
                onChange={(e) => setInvType(e.target.value)}
              >
                <option value="bond">Állampapír</option>
                <option value="stock">Részvény</option>
                <option value="other">Egyéb</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.savings.owner}>Tulajdonos</FieldLabel>
              {savingsSettings.owners.length > 0 ? (
                <>
                  <select
                    className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                    value={savingsSettings.owners.includes(invOwner) ? invOwner : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'custom') setInvOwner('');
                      else setInvOwner(e.target.value);
                    }}
                  >
                    {savingsSettings.owners.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                    <option value="custom">Egyedi…</option>
                  </select>
                  {!savingsSettings.owners.includes(invOwner) && (
                    <Input
                      placeholder="Pl. Szandi, Dani"
                      value={invOwner}
                      onChange={(e) => setInvOwner(e.target.value)}
                      required
                      className="mt-2"
                    />
                  )}
                </>
              ) : (
                <Input
                  placeholder="Pl. Közös, Szandi…"
                  value={invOwner}
                  onChange={(e) => setInvOwner(e.target.value)}
                  required
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel info={HELP.savings.principal}>Tőke (Ft)</FieldLabel>
              <Input
                type="number"
                placeholder="0"
                value={invPrincipal}
                onChange={(e) => setInvPrincipal(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.savings.maturityAmount}>Lejárati érték (Ft)</FieldLabel>
              <Input
                type="number"
                placeholder="pl. 7 000 000"
                value={invMaturityValue}
                onChange={(e) => setInvMaturityValue(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel info={HELP.savings.invRate}>Éves kamat / hozam (%)</FieldLabel>
            <Input
              type="number"
              step="0.01"
              placeholder="pl. 5.15"
              value={invRate}
              onChange={(e) => setInvRate(e.target.value)}
              required={!invMaturityValue}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel info={HELP.savings.purchaseDate}>Vásárlás dátuma</FieldLabel>
              <DatePicker value={invPurchaseDate} onChange={setInvPurchaseDate} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.savings.maturityDate}>Lejárat (opcionális)</FieldLabel>
              <DatePicker value={invMaturityDate} onChange={setInvMaturityDate} />
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2.5">
            <FieldLabel info={HELP.savings.payoutAmount}>Kamatkifizetés (opcionális · pl. FixMÁP)</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.savings.payoutAmount}>
                  Összeg (Ft)
                </FieldLabel>
                <Input
                  type="number"
                  placeholder="pl. 72 630"
                  value={invNextPayoutAmount}
                  onChange={(e) => setInvNextPayoutAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel className="text-[0.7rem] text-muted-foreground" info={HELP.savings.payoutDate}>
                  Dátum
                </FieldLabel>
                <DatePicker value={invNextPayoutDate} onChange={setInvNextPayoutDate} />
              </div>
            </div>
          </div>
          <ModalFormFooter onCancel={resetAndClose} submitLabel="Létrehozás" />
        </form>
      )}
    </Modal>
  );
}
