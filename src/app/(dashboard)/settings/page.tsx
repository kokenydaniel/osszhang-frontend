import { Metadata } from 'next';
import SettingsClient from '@/components/modules/settings/SettingsClient';

export const metadata: Metadata = {
  title: 'Beállítások | Háztartás Menedzser',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
