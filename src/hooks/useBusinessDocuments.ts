'use client';

import { useCallback, useEffect, useState } from 'react';
import { businessClient } from '@/lib/api-client';
import { downloadAuthenticatedFile } from '@/helpers/download-blob';
import { StatusCodes } from '@/types/api';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { BusinessDocument, BusinessDocumentType } from '@/types/attachments';

export function useBusinessDocuments(year: number, month: number) {
  const { addNotification } = useNotificationStore();
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState<BusinessDocumentType | null>(null);
  const [downloadingBundle, setDownloadingBundle] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);
  const [syncingSumup, setSyncingSumup] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await businessClient.listDocuments(year, month);
      if (res && res[0] === StatusCodes.Http200) {
        setDocuments(res[1] ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upload = useCallback(
    async (params: {
      documentType: BusinessDocumentType;
      file: File;
      businessOrderId?: number | null;
      label?: string | null;
    }) => {
      setUploadingType(params.documentType);
      try {
        const res = await businessClient.uploadDocument({
          year,
          month,
          documentType: params.documentType,
          file: params.file,
          businessOrderId: params.businessOrderId,
          label: params.label,
        });
        if (res && res[0] === StatusCodes.Http201) {
          addNotification('Dokumentum feltöltve.', 'success');
          await refresh();
          return true;
        }
        addNotification('A feltöltés nem sikerült.', 'error');
        return false;
      } finally {
        setUploadingType(null);
      }
    },
    [addNotification, month, refresh, year],
  );

  const remove = useCallback(
    async (id: number) => {
      const res = await businessClient.deleteDocument(id);
      if (res && res[0] === StatusCodes.Http200) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        addNotification('Dokumentum törölve.', 'success');
        return true;
      }
      addNotification('A törlés nem sikerült.', 'error');
      return false;
    },
    [addNotification],
  );

  const downloadOne = useCallback(async (doc: BusinessDocument) => {
    setDownloadingDocId(doc.id);
    try {
      const ok = await downloadAuthenticatedFile(
        `business-documents/${doc.id}/download`,
        doc.originalName,
      );
      if (!ok) addNotification('A letöltés nem sikerült.', 'error');
    } finally {
      setDownloadingDocId(null);
    }
  }, [addNotification]);

  const downloadBundle = useCallback(async () => {
    setDownloadingBundle(true);
    try {
      const monthLabel = String(month).padStart(2, '0');
      const ok = await downloadAuthenticatedFile(
        'business-documents/bundle',
        `konyvelesi-anyag-${year}-${monthLabel}.zip`,
        { year, month },
      );
      if (!ok) {
        addNotification('Nincs letölthető csomag, vagy a letöltés sikertelen.', 'error');
      }
    } finally {
      setDownloadingBundle(false);
    }
  }, [addNotification, month, year]);

  const syncSumup = useCallback(async () => {
    setSyncingSumup(true);
    try {
      const res = await businessClient.sumupImport(year, month);
      if (res && res[0] === StatusCodes.Http200) {
        addNotification(res[1].message ?? 'SumUp import kész.', 'success');
        await useAuthStore.getState().fetchMe();
        await refresh();
        return true;
      }
      addNotification('A SumUp import nem sikerült.', 'error');
      return false;
    } finally {
      setSyncingSumup(false);
    }
  }, [addNotification, month, refresh, year]);

  const byType = useCallback(
    (type: BusinessDocumentType) => documents.filter((d) => d.documentType === type),
    [documents],
  );

  return {
    documents,
    loading,
    uploadingType,
    downloadingBundle,
    downloadingDocId,
    refresh,
    upload,
    remove,
    downloadOne,
    downloadBundle,
    syncSumup,
    syncingSumup,
    byType,
  };
}
