import { Metadata } from 'next';
import { UtilitiesUiProvider } from '@/components/modules/utilities/UtilitiesUiContext';
import UtilitiesPage from '@/components/modules/utilities/utilities-page';

export const metadata: Metadata = {
  title: 'Rezsi | Háztartás Menedzser',
};

export default function Page() {
  return (
    <UtilitiesUiProvider>
      <UtilitiesPage />
    </UtilitiesUiProvider>
  );
}
