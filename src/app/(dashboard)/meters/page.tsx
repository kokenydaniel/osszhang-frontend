import { Metadata } from 'next';
import MetersClient from '@/components/modules/meters/MetersClient';

export const metadata: Metadata = {
  title: 'Közműórák | Háztartás Menedzser',
};

export default function MetersPage() {
  return <MetersClient />;
}
