'use client';

import { createElement, useCallback, useState } from 'react';
import { ConfirmDeleteDialog } from '@/components/design/ConfirmDeleteDialog';

export interface ConfirmDeleteOptions {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void | Promise<void>;
}

export function useConfirmDelete() {
  const [pending, setPending] = useState<ConfirmDeleteOptions | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const requestDelete = useCallback((options: ConfirmDeleteOptions) => {
    setPending(options);
  }, []);

  const ConfirmDeleteModal = useCallback(() => {
    if (!pending) return null;
    return createElement(ConfirmDeleteDialog, {
      pending,
      confirmLoading,
      onClose: () => {
        if (confirmLoading) return;
        setPending(null);
      },
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          await Promise.resolve(pending.onConfirm());
          setPending(null);
        } catch {
          // Modal marad nyitva — a hívó kezeli az értesítést
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  }, [confirmLoading, pending]);

  return { requestDelete, ConfirmDeleteModal, confirmLoading };
}
