import { Metadata } from 'next';
import BusinessPage from '@/components/modules/business/business-page';

export const metadata: Metadata = {
  title: 'Little Loom | Háztartás Menedzser',
};

export default function Page() {
  return <BusinessPage />;
}
