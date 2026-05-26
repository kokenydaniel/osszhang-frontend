import { Metadata } from 'next';
import { DebtsUiProvider } from '@/components/modules/debts/DebtsUiContext';
import DebtsPage from '@/components/modules/debts/debts-page';

export const metadata: Metadata = {
  title: 'Tartozások | Háztartás Menedzser',
};

export default function Page() {
  return (
    <DebtsUiProvider>
      <DebtsPage />
    </DebtsUiProvider>
  );
}
