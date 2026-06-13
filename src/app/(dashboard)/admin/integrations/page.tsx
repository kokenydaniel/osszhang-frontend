import { FeatureFlagsPage } from '@/components/admin/feature-flags-page';

export default function Page() {
  return (
    <FeatureFlagsPage
      category="integration"
      title="Platform admin / Integrációk"
      description="Webshop rendelés import engedélyezése platform szinten. A bolt adatait háztartásonként a Beállítások → Modulok → Vállalkozás alatt adják meg."
      currentRoute="/admin/integrations"
    />
  );
}
