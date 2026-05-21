import { Metadata } from 'next';
import MetersPage from '@/components/modules/meters/meters-page';

export const metadata: Metadata = {
  title: 'Közműórák | Háztartás Menedzser',
};

export default function Page() {
  return <MetersPage />;
}
