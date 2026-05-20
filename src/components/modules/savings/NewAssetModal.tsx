'use client';

import { useEffect, useState } from 'react';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { HELP } from '@/lib/helpTexts';
import { SegmentedControl } from '@/components/design';
import { Wallet, TrendingUp } from 'lucide-react';

type AssetKind = 'account' | 'investment';

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKind?: AssetKind;
}

export function NewAssetModal({ isOpen, onClose, initialKind = 'account' }: NewAssetModalProps) {
  const { addSavingsAccount, addInvestment } = useSavingsStore();

  const [kind, setKind] = useState<AssetKind>(initialKind);

  const [savInst, setSavInst] = useState('');
  const [savCurr, setSavCurr] = useState('HUF');
  const [savOwner, setSavOwner] = useState('Közös');

  const [invName, setInvName] = useState('');
  const [invType, setInvType] = useState('bond');
  const [invPrincipal, setInvPrincipal] = useState('');
  const [invRate, setInvRate] = useState('');
  const [invPurchaseDate, setInvPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [invMaturityDate, setInvMaturityDate] = useState('');
  const [invOwner, setInvOwner] = useState('Közös');
  const [invMaturityValue, setInvMaturityValue] = useState('');
  const [invNextPayoutAmount, setInvNextPayoutAmount] = useState('');
  const [invNextPayoutDate, setInvNextPayoutDate] = useState('');

  useEffect(() => {
    if (isOpen) setKind(initialKind);
  }, [isOpen, initialKind]);

  const resetAndClose = () => {
    onClose();
    setSavInst('');
    setSavCurr('HUF');
    setSavOwner('Közös');
    setInvName('');
    setInvType('bond');
    setInvPrincipal('');
    setInvRate('');
    setInvPurchaseDate(new Date().toISOString().split('T')[0]);
    setInvMaturityDate('');
    setInvOwner('Közös');
    setInvMaturityValue('');
    setInvNextPayoutAmount('');
    setInvNextPayoutDate('');
  };

  const handleSavingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSavingsAccount({ institution: savInst, currency: savCurr, owner: savOwner, count_in_savings: true });
    resetAndClose();
  };

  const handleInvestmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalRate = Number(invRate);
    if (invMaturityValue && Number(invMaturityValue) > 0 && invMaturityDate && invPurchaseDate) {
      const pDate = new Date(invPurchaseDate);
      const mDate = new Date(invMaturityDate);
      const diffDays = Math.ceil(Math.max(0, mDate.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24));
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
      countInSavings: true,
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
                <option value="HUF">HUF</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.savings.owner}>Tulajdonos</FieldLabel>
              <select
                className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                value={savOwner === 'Közös' || savOwner === 'Little Loom' ? savOwner : 'custom'}
                onChange={(e) => {
                  if (e.target.value === 'custom') setSavOwner('');
                  else setSavOwner(e.target.value);
                }}
              >
                <option value="Közös">Közös</option>
                <option value="Little Loom">Little Loom</option>
                <option value="custom">Egyedi…</option>
              </select>
              {savOwner !== 'Közös' && savOwner !== 'Little Loom' && (
                <Input
                  placeholder="Pl. Szandi, Dani"
                  value={savOwner}
                  onChange={(e) => setSavOwner(e.target.value)}
                  required
                  className="mt-2"
                />
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={resetAndClose}>
              Mégse
            </Button>
            <Button type="submit" className="flex-1">
              Létrehozás
            </Button>
          </div>
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
              <select
                className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                value={invOwner === 'Közös' || invOwner === 'Little Loom' ? invOwner : 'custom'}
                onChange={(e) => {
                  if (e.target.value === 'custom') setInvOwner('');
                  else setInvOwner(e.target.value);
                }}
              >
                <option value="Közös">Közös</option>
                <option value="Little Loom">Little Loom</option>
                <option value="custom">Egyedi…</option>
              </select>
              {invOwner !== 'Közös' && invOwner !== 'Little Loom' && (
                <Input
                  placeholder="Pl. Szandi, Dani"
                  value={invOwner}
                  onChange={(e) => setInvOwner(e.target.value)}
                  required
                  className="mt-2"
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
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={resetAndClose}>
              Mégse
            </Button>
            <Button type="submit" className="flex-1">
              Létrehozás
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
