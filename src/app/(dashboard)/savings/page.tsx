import { Metadata } from 'next';
import SavingsPage from '@/components/modules/savings/savings-page';

export const metadata: Metadata = {
  title: 'Megtakarítások | Háztartás Menedzser',
};

export default function Page() {
  return <SavingsPage />;
}
