import { Metadata } from 'next';
import { Suspense } from 'react';
import SettingsPage from '@/components/modules/settings/settings-page';

export const metadata: Metadata = {
  title: 'Beállítások | Háztartás Menedzser',
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SettingsPage />
    </Suspense>
  );
}
