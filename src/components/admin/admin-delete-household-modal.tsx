'use client';

import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { AdminHousehold } from '@/types/admin';

type AdminDeleteHouseholdModalProps = {
  household: AdminHousehold | null;
  onClose: () => void;
  onConfirm: (confirmName: string) => Promise<boolean>;
  loading?: boolean;
};

export function AdminDeleteHouseholdModal({
  household,
  onClose,
  onConfirm,
  loading = false,
}: AdminDeleteHouseholdModalProps) {
  const [confirmName, setConfirmName] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  if (!household) return null;

  const householdName = household.name.trim();
  const canConfirm = confirmName.trim() === householdName && acknowledged && !loading;

  const handleClose = () => {
    if (loading) return;
    setConfirmName('');
    setAcknowledged(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    const ok = await onConfirm(confirmName.trim());
    if (ok) {
      setConfirmName('');
      setAcknowledged(false);
    }
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-destructive/20 gap-0">
        <div className="bg-destructive/10 p-6 pb-4 border-b border-destructive/10 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/20 text-destructive flex items-center justify-center mb-4">
            <TriangleAlert size={24} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive font-bold">Háztartás törlése</DialogTitle>
            <DialogDescription className="text-destructive/80 font-medium">
              A művelet végleges — minden tag fiókja és adata törlődik.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-background">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A <span className="font-semibold text-foreground">{householdName}</span> háztartás és{' '}
              {household.members_count} tag fiókja véglegesen törlődik, beleértve:
            </p>
            <ul className="text-sm font-medium text-foreground space-y-2 pl-4 list-disc marker:text-destructive">
              <li>Költségvetés, tranzakciók, megtakarítások</li>
              <li>Rezsi, tartozások, vállalkozási rendelések</li>
              <li>Minden csatolt adat és beállítás</li>
            </ul>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 flex-shrink-0 w-4 h-4 text-destructive border-border rounded focus:ring-destructive"
              />
              <span className="text-sm text-muted-foreground leading-snug">
                Megértettem, hogy a törlés végleges és az adatok nem állíthatók helyre.
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Gépeld be a háztartás nevét a megerősítéshez:
              <br />
              <span className="text-destructive font-bold tracking-tight select-none mt-1 inline-block">
                {householdName}
              </span>
            </label>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={householdName}
              className="border-destructive/30 focus-visible:ring-destructive/30"
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/40 border-t border-border flex sm:justify-between items-center gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Mégsem
          </Button>
          <Button variant="destructive" onClick={() => void handleConfirm()} disabled={!canConfirm}>
            {loading ? 'Törlés…' : 'Háztartás törlése'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
