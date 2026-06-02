import { Metadata } from 'next';
import { BusinessPage } from '@/components/business/business-page';

export const metadata: Metadata = {
  title: 'Vállalkozás | Háztartás Menedzser',
};

export default function Page() {
  return <BusinessPage />;
}
