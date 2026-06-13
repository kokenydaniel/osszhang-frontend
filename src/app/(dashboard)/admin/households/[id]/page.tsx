import { AdminHouseholdDetailPage } from '@/components/admin/admin-household-detail-page';

type AdminHouseholdDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminHouseholdDetailRoute({ params }: AdminHouseholdDetailRouteProps) {
  const { id } = await params;
  const householdId = Number(id);

  if (!Number.isFinite(householdId) || householdId <= 0) {
    return null;
  }

  return <AdminHouseholdDetailPage householdId={householdId} />;
}
