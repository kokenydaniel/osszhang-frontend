import { FeatureFlagsPage } from '@/components/admin/feature-flags-page';

export default function Page() {
  return (
    <FeatureFlagsPage
      category="ai"
      title="Platform admin / AI kapcsolók"
      description="Okos pénzügyi funkciók be- és kikapcsolása platform szinten."
    />
  );
}
