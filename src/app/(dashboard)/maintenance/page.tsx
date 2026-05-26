'use client';

import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/design/PageHeader';
import { InsightBanner } from '@/components/design/InsightBanner';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';

export default function MaintenancePage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <PageHeader
        title="Karbantartás"
        description="Rendszerünk jelenleg karbantartás alatt áll."
      />

      <InsightBanner tone="warning" icon={Construction} title="Hamarosan visszatérünk">
        Rendszerünk jelenleg karbantartás alatt áll. Dolgozunk azon, hogy minél hamarabb újra elérhető legyen
        az alkalmazás. Köszönjük a türelmedet!
      </InsightBanner>

      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground leading-relaxed">
        Ha platform admin vagy, a karbantartási mód alatt is hozzáférhetsz a rendszerhez. Normál felhasználóként
        most csak várni tudsz — értesítünk, amint minden újra működik.
      </div>

      <Button variant="outline" onClick={() => void handleLogout()} className="self-start">
        Kijelentkezés
      </Button>
    </div>
  );
}
