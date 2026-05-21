import { Metadata } from 'next';
import SettingsPage from '@/components/modules/settings/settings-page';

export const metadata: Metadata = {
  title: 'Beállítások | Háztartás Menedzser',
};

export default function Page() {
  return <SettingsPage />;
}
