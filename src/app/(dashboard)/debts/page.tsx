import { Metadata } from 'next';
import { DebtsPage } from '@/components/debts/debts-page';

export const metadata: Metadata = {
  title: 'Tartozások | Háztartás Menedzser',
};

export default function Page() {
  return <DebtsPage />;
}
