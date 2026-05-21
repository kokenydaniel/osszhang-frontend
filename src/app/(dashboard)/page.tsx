import { Metadata } from 'next';
import DashboardPage from '@/components/modules/dashboard/dashboard-page';

export const metadata: Metadata = {
  title: 'Irányítópult | Háztartás Menedzser',
};

export default function Page() {
  return <DashboardPage />;
}
