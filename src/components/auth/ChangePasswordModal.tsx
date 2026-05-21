'use client';

import { useState } from 'react';
import { authClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { Lock, ShieldAlert } from 'lucide-react';

export function ChangePasswordModal() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const { addNotification } = useNotificationStore();

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const open = Boolean(user?.mustChangePassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A jelszónak legalább 8 karakter hosszúnak kell lennie.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('A két jelszó nem egyezik.');
      return;
    }

    setLoading(true);
    try {
      await authClient.changePassword({
        password,
        password_confirmation: passwordConfirmation,
      });
      await fetchMe();
      setPassword('');
      setPasswordConfirmation('');
      addNotification('Jelszó frissítve — mostantól csak te férsz hozzá a fiókodhoz.', 'success');
    } catch {
      setError('Nem sikerült menteni a jelszót. Próbáld újra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => {}}
      dismissible={false}
      title="Új jelszó szükséges"
      description="Az admin ideiglenes jelszót adott meg. Első belépéskor kötelező saját jelszót választanod."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
          <ShieldAlert size={16} className="text-primary shrink-0 mt-0.5" />
          <p>
            Belépési név: <span className="font-semibold">{user?.username}</span>
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <FieldLabel>Új jelszó</FieldLabel>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              className="pl-8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Jelszó megerősítése</FieldLabel>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              className="pl-8"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          Jelszó mentése
        </Button>
      </form>
    </Modal>
  );
}
