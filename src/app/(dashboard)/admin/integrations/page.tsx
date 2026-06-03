import { FeatureFlagsPage } from '@/components/admin/feature-flags-page';

export default function Page() {
  return (
    <FeatureFlagsPage
      category="integration"
      title="Platform admin / Integráció kapcsolók"
      description="Shopify, WooCommerce és UNAS rendelés import engedélyezése platform szinten."
    />
  );
}
