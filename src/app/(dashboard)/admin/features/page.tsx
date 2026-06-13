import { FeatureFlagsPage } from '@/components/admin/feature-flags-page';

export default function Page() {
  return (
    <FeatureFlagsPage
      category="system"
      title="Platform admin / Karbantartás & béta"
      description="Üzemeltetési kapcsolók — karbantartási mód és ideiglenes Premium hozzáférés. Modulok, integrációk és AI kapcsolók külön oldalakon vannak."
      currentRoute="/admin/features"
    />
  );
}
