import { Metadata } from 'next';
import { SavingsUiProvider } from '@/components/modules/savings/SavingsUiContext';
import SavingsPage from '@/components/modules/savings/savings-page';

export const metadata: Metadata = {
  title: 'Megtakarítások | Háztartás Menedzser',
};

/**
 * Savings route entry point.
 * Wraps the module in SavingsUiProvider to scope all modal/form UI state
 * to this route subtree — keeping it out of global Zustand stores.
 */
export default function Page() {
  return (
    <SavingsUiProvider>
      <SavingsPage />
    </SavingsUiProvider>
  );
}
