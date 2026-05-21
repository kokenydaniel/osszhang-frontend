import { Metadata } from 'next';
import UtilitiesPage from '@/components/modules/utilities/utilities-page';

export const metadata: Metadata = {
  title: 'Rezsi | Háztartás Menedzser',
};

export default function Page() {
  return <UtilitiesPage />;
}
