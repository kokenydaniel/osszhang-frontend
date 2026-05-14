import { Metadata } from 'next';
import BusinessClient from '@/components/modules/business/BusinessClient';

export const metadata: Metadata = {
  title: 'Little Loom | Háztartás Menedzser',
};

export default function BusinessPage() {
  return <BusinessClient />;
}
