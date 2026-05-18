import { Metadata } from 'next';
import DashboardClient from '@/components/modules/dashboard/DashboardClient';

export const metadata: Metadata = {
  title: 'Irányítópult | Háztartás Menedzser',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
