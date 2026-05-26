import { Metadata } from 'next';
import { FeatureFlagsPage } from '@/components/modules/admin/feature-flags-page';

export const metadata: Metadata = {
  title: 'Rendszer funkciók | Platform admin',
};

export default function AdminFeaturesPage() {
  return <FeatureFlagsPage />;
}
