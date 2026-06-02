import { Metadata } from 'next';
import { SavingsPage } from '@/components/savings/savings-page';

export const metadata: Metadata = {
  title: 'Megtakarítások | Háztartás Menedzser',
};

export default function Page() {
  return <SavingsPage />;
}
