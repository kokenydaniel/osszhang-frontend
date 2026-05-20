import { Metadata } from 'next';
import DebtsClient from '@/components/modules/debts/DebtsClient';

export const metadata: Metadata = {
  title: 'Tartozások | Háztartás Menedzser',
};

export default function DebtsPage() {
  return <DebtsClient />;
}
