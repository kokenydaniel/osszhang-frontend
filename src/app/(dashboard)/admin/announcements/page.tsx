import { Metadata } from 'next';
import { AnnouncementsPage } from '@/components/modules/admin/announcements-page';

export const metadata: Metadata = {
  title: 'Rendszerüzenetek | Platform admin',
};

export default function AdminAnnouncementsPage() {
  return <AnnouncementsPage />;
}
