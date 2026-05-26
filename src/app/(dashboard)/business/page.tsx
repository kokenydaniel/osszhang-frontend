import { Metadata } from 'next';
import { BusinessUiProvider } from '@/components/modules/business/BusinessUiContext';
import BusinessPage from '@/components/modules/business/business-page';

export const metadata: Metadata = {
  title: 'Vállalkozás | Háztartás Menedzser',
};

export default function Page() {
  return (
    <BusinessUiProvider>
      <BusinessPage />
    </BusinessUiProvider>
  );
}
