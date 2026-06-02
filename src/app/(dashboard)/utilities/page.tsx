import { Metadata } from 'next';
import { UtilitiesPage } from '@/components/utilities/utilities-page';

export const metadata: Metadata = {
  title: 'Rezsi | Háztartás Menedzser',
};

export default function Page() {
  return <UtilitiesPage />;
}
