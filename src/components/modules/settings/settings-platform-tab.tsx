'use client';

import { FlaskConical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { InsightBanner, StatusPill } from '@/components/design';
import { SettingsSectionHeading } from '@/components/modules/settings/settings-ui';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useState } from 'react';

export function SettingsPlatformTab() {
  const user = useAuthStore((s) => s.user);
  const updateBetaMode = useAuthStore((s) => s.updateBetaMode);
  const { addNotification } = useNotificationStore();
  const [saving, setSaving] = useState(false);

  const betaEnabled = Boolean(user?.betaMode);

  const handleToggle = async (enabled: boolean) => {
    setSaving(true);
    try {
      await updateBetaMode(enabled);
      addNotification(
        enabled
          ? 'Béta mód bekapcsolva — a tier korlátozások és upgrade ablakok kikapcsolva.'
          : 'Béta mód kikapcsolva — a csomagkorlátozások újra érvényesek.',
        'success',
      );
    } catch {
      addNotification('A platform beállítás mentése nem sikerült.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SettingsSectionHeading
        title="Platform"
        description="Super admin beállítások — az egész alkalmazásra vonatkoznak."
      />

      <InsightBanner tone="info" icon={FlaskConical} title="Super admin zóna">
        Ezek a kapcsolók minden háztartásra hatnak. Béta módban minden modul szabadon használható, a Stripe számlázás
        ki van kapcsolva. Kikapcsolva az app éles előfizetési rendszerre vált.
      </InsightBanner>

      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 max-w-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground">Béta verzió</h3>
              <StatusPill status={betaEnabled ? 'success' : 'neutral'} size="xs">
                {betaEnabled ? 'Aktív' : 'Inaktív'}
              </StatusPill>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Bekapcsolva: minden háztartás szabadon engedélyezhet modulokat és prémium funkciókat fizetés nélkül.
              A Stripe checkout és számlázás ki van kapcsolva. A Pro/Premium badge-ek megmaradnak, upgrade ablak
              nem jelenik meg. Kikapcsolva: éles Free/Pro/Premium korlátozások és Stripe előfizetés érvényesül.
            </p>
          </div>
          <Switch
            checked={betaEnabled}
            disabled={saving}
            onCheckedChange={(v) => void handleToggle(v)}
            aria-label="Béta verzió"
          />
        </div>
      </div>
    </>
  );
}
