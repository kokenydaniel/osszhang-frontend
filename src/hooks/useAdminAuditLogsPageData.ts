'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';

type AuditRow = {
  id: number;
  action: string;
  user: { id: number; name: string } | null;
  household: { id: number; name: string } | null;
  created_at: string | null;
};

export function useAdminAuditLogsPageData() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await adminClient.listAuditLogs();
      if (res && res[0] === StatusCodes.Http200) {
        setRows((res[1] as { data: AuditRow[] }).data ?? []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, loading, refreshing, refresh };
}
