import { Metadata } from 'next';
import SavingsClient from '@/components/modules/savings/SavingsClient';

export const metadata: Metadata = {
  title: 'Megtakarítások | Háztartás Menedzser',
};

export default function SavingsPage() {
  return <SavingsClient />;
}
