import { FeatureFlagsPage } from '@/components/admin/feature-flags-page';

export default function Page() {
  return (
    <FeatureFlagsPage
      category="ai"
      title="Platform admin / AI kapcsolók"
      description="Okos pénzügyi eszközök modulokon belül. Az utazástervező AI-hoz külön kapcsold be az Utazástervező modult is a Modul kiadás oldalon."
      currentRoute="/admin/ai-features"
    />
  );
}
