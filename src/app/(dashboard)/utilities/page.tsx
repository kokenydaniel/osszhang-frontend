import { Metadata } from 'next';
import UtilitiesClient from '@/components/modules/utilities/UtilitiesClient';

export const metadata: Metadata = {
  title: 'Rezsi | Háztartás Menedzser',
};

export default function UtilitiesPage() {
  return <UtilitiesClient />;
}
