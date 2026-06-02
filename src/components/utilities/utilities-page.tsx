'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModulePageSkeleton } from '@/components/design';
import { useUtilitiesStore } from '@/stores/utilitiesStore';
import { LoadableStatus } from '@/utils/loadable-status';
import type { UtilityBill } from '@/types';
import { UtilitiesPageContent } from './utilities-page-content';
import { UtilitiesBillModal } from './bill-modal/bill-modal';

export function UtilitiesPage() {
  const bills = useUtilitiesStore((s) => s.bills);
  const settlements = useUtilitiesStore((s) => s.settlements);
  const status = useUtilitiesStore((s) => s.status);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<UtilityBill | null>(null);

  useEffect(() => {
    void useUtilitiesStore.getState().fetch();
  }, []);

  const data = useMemo(() => ({ bills, settlements }), [bills, settlements]);

  const initialLoading =
    (status === LoadableStatus.Unloaded || status === LoadableStatus.Loading) && bills.length === 0;

  const refresh = () => void useUtilitiesStore.getState().fetch(true);

  const closeBillModal = () => {
    setBillModalOpen(false);
    setEditingBill(null);
  };

  const handleBillSaved = (bill: UtilityBill) => {
    if (editingBill) {
      useUtilitiesStore.getState().patchBill(bill.id, bill);
    } else {
      useUtilitiesStore.getState().appendBill(bill);
    }
    closeBillModal();
  };

  const openNewBill = () => {
    setEditingBill(null);
    setBillModalOpen(true);
  };

  const openEditBill = (bill: UtilityBill) => {
    setEditingBill(bill);
    setBillModalOpen(true);
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col gap-7 max-w-[1500px] mx-auto w-full">
        <ModulePageSkeleton />
      </div>
    );
  }

  return (
    <>
      <UtilitiesPageContent
        data={data}
        onRefresh={refresh}
        onOpenNewBill={openNewBill}
        onEditBill={openEditBill}
      />
      <UtilitiesBillModal
        open={billModalOpen}
        editingBill={editingBill}
        onClose={closeBillModal}
        onSaved={handleBillSaved}
      />
    </>
  );
}
