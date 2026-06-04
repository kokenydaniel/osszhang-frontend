'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import type { FeedbackCategory, FeedbackStatus } from '@/config/feedback';
import type { FeedbackReport } from '@/types/feedback';

export function useAdminFeedbackReportsPageData(
  statusFilter: FeedbackStatus | 'all',
  categoryFilter: FeedbackCategory | 'all',
) {
  const [rows, setRows] = useState<FeedbackReport[]>([]);
  const [attentionCount, setAttentionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await adminClient.listFeedbackReports({
        status: statusFilter,
        category: categoryFilter,
      });
      if (res && res[0] === StatusCodes.Http200) {
        setRows(res[1].items);
        setAttentionCount(res[1].attentionCount);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateStatus = useCallback(async (id: number, status: FeedbackStatus) => {
    const res = await adminClient.updateFeedbackReportStatus(id, status);
    if (res && res[0] === StatusCodes.Http200) {
      setRows((prev) => prev.map((r) => (r.id === id ? res[1] : r)));
      return res[1];
    }
    return null;
  }, []);

  const loadDetail = useCallback(async (id: number) => {
    const res = await adminClient.showFeedbackReport(id);
    if (res && res[0] === StatusCodes.Http200) {
      setRows((prev) => prev.map((r) => (r.id === id ? res[1] : r)));
      return res[1];
    }
    return null;
  }, []);

  const sendReply = useCallback(async (id: number, body: string) => {
    const res = await adminClient.replyFeedbackReport(id, body);
    if (res && res[0] === StatusCodes.Http200) {
      setRows((prev) => prev.map((r) => (r.id === id ? res[1] : r)));
      void refresh();
      return res[1];
    }
    return null;
  }, [refresh]);

  return {
    rows,
    attentionCount,
    loading,
    refreshing,
    refresh,
    updateStatus,
    loadDetail,
    sendReply,
  };
}
