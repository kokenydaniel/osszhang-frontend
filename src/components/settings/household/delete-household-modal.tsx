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
import { useAuthStore } from '@/stores/useAuthStore';
import { householdClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { LoadableStatus } from '@/utils/loadable-status';
import { resetSessionData } from '@/helpers/reset-session-data';
import { removeAuthToken } from '@/helpers/auth-token';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface SettingsDeleteHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDeleteHouseholdModal({ isOpen, onClose }: SettingsDeleteHouseholdModalProps) {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [isDeletingHousehold, setIsDeletingHousehold] = useState(false);

  const householdDisplayName = user?.household?.name || '';
  const canConfirmDelete = deleteConfirmName.trim() === householdDisplayName.trim() && deleteAcknowledged && !isDeletingHousehold;

  const handleClose = () => {
    if (isDeletingHousehold) return;
    setDeleteConfirmName('');
    setDeleteAcknowledged(false);
    onClose();
  };

  const handleDeleteHousehold = async () => {
    if (!canConfirmDelete) return;
    setIsDeletingHousehold(true);
    try {
      const res = await householdClient.destroy(deleteConfirmName.trim());
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http204)) {
        throw new Error('API Error');
      }
      removeAuthToken();
      resetSessionData();
      useAuthStore.setState({ user: null, authToken: null, status: LoadableStatus.Loaded });
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch {
      addNotification('A törlés nem sikerült.', 'error');
      setIsDeletingHousehold(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-destructive/20 gap-0">
        <div className="bg-destructive/10 p-6 pb-4 border-b border-destructive/10 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/20 text-destructive flex items-center justify-center mb-4">
            <TriangleAlert size={24} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive font-bold">Veszélyes művelet!</DialogTitle>
            <DialogDescription className="text-destructive/80 font-medium">
              A háztartás törlése végleges és nem vonható vissza.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-background">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Minden adat, ami ehhez a háztartáshoz tartozik, azonnal törlődik az adatbázisunkból, beleértve:
            </p>
            <ul className="text-sm font-medium text-foreground space-y-2 pl-4 list-disc marker:text-destructive">
              <li>Minden bejegyzés, kiadás, bevétel, tranzakció</li>
              <li>Minden regisztrált családtag fiókja</li>
              <li>Rezsi számlák, megtakarítások, hitelek</li>
              <li>A vállalkozás rendelései</li>
            </ul>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteAcknowledged}
                onChange={(e) => setDeleteAcknowledged(e.target.checked)}
                className="mt-1 flex-shrink-0 w-4 h-4 text-destructive border-border rounded focus:ring-destructive"
              />
              <span className="text-sm text-muted-foreground leading-snug">
                Megértettem, hogy a törlés végleges és az adatok nem állíthatók helyre.
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Kérlek gépeld be a háztartás nevét a megerősítéshez:
              <br />
              <span className="text-destructive font-bold tracking-tight select-none mt-1 inline-block">
                {householdDisplayName}
              </span>
            </label>
            <Input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={householdDisplayName}
              className="border-destructive/30 focus-visible:ring-destructive/30"
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/40 border-t border-border flex sm:justify-between items-center gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={isDeletingHousehold}>
            Mégsem, visszalépek
          </Button>
          <Button variant="destructive" onClick={handleDeleteHousehold} disabled={!canConfirmDelete}>
            {isDeletingHousehold ? 'Törlés folyamatban…' : 'Igen, mindent törlök'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
