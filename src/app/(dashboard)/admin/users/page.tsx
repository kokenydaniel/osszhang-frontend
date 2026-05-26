import { Metadata } from 'next';
import { UserManagementPage } from '@/components/modules/admin/user-management-page';

export const metadata: Metadata = {
  title: 'Felhasználók | Platform admin',
};

export default function AdminUsersPage() {
  return <UserManagementPage />;
}
