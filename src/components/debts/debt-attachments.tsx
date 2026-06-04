'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { attachmentsClient } from '@/lib/api-client';
import { downloadAuthenticatedFile } from '@/helpers/download-blob';
import { StatusCodes } from '@/types/api';
import { isPlatformFeatureEnabled } from '@/config/platform-feature-flags';
import { canUseFeature } from '@/helpers/check-access';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { FileAttachment } from '@/types/attachments';
import { AttachmentFileRow } from '@/components/attachments/attachment-file-row';
import { AttachmentsListLoading } from '@/components/attachments/attachments-list-loading';

type DebtAttachmentsProps = {
  debtId: number;
  canEdit?: boolean;
  onCountChange?: (count: number) => void;
};

export function DebtAttachments({ debtId, canEdit = true, onCountChange }: DebtAttachmentsProps) {
  const user = useAuthStore((s) => s.user);
  const { addNotification } = useNotificationStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const onCountChangeRef = useRef(onCountChange);
  onCountChangeRef.current = onCountChange;

  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const enabled =
    isPlatformFeatureEnabled(user, 'enable_attachments') && canUseFeature(user, 'attachments');

  const refresh = useCallback(async () => {
    if (!enabled || debtId <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await attachmentsClient.listForDebt(debtId);
      if (res && res[0] === StatusCodes.Http200) {
        const list = res[1] ?? [];
        setFiles(list);
        onCountChangeRef.current?.(list.length);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, debtId]);

  useEffect(() => {
    setFiles([]);
    setLoading(true);
    void refresh();
  }, [debtId, enabled, refresh]);

  const handleUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file || !enabled || !canEdit || debtId <= 0) return;
    setUploading(true);
    try {
      const res = await attachmentsClient.uploadToDebt(debtId, file);
      if (res && res[0] === StatusCodes.Http201) {
        await refresh();
      } else {
        addNotification('A feltöltés nem sikerült.', 'error');
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (attachmentId: number) => {
    const res = await attachmentsClient.deleteAttachment(attachmentId);
    if (res && res[0] === StatusCodes.Http200) {
      setFiles((prev) => {
        const next = prev.filter((f) => f.id !== attachmentId);
        onCountChangeRef.current?.(next.length);
        return next;
      });
    }
  };

  if (!enabled) {
    return (
      <p className="text-xs text-muted-foreground">
        Dokumentum-csatolás a Premium csomagban és a platform csatolás funkciójával érhető el.
      </p>
    );
  }

  if (debtId <= 0) {
    return (
      <p className="text-xs text-muted-foreground">
        A tartozás mentése után tölthetsz fel dokumentumokat (szerződés, hitelkérelem, stb.).
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/15 px-3 py-3">
      <div className="flex items-center gap-1.5 text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider">
        <FileText size={12} />
        Dokumentumok
      </div>
      <p className="text-xs text-muted-foreground">
        Pl. hitelszerződés, hitelkérelem, banki igazolás — PDF vagy kép formátumban, több fájl is feltölthető.
      </p>
      {loading ? <AttachmentsListLoading /> : null}
      {!loading && files.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Nincs csatolt dokumentum.</p>
      ) : null}
      {!loading
        ? files.map((file) => (
        <AttachmentFileRow
          key={file.id}
          file={file}
          disabled={loading || uploading || downloadingId !== null}
          downloading={downloadingId === file.id}
          onDownload={async () => {
            setDownloadingId(file.id);
            try {
              const ok = await downloadAuthenticatedFile(
                `attachments/${file.id}/download`,
                file.originalName,
              );
              if (!ok) addNotification('A letöltés nem sikerült.', 'error');
            } finally {
              setDownloadingId(null);
            }
          }}
          onDelete={canEdit ? () => void handleDelete(file.id) : undefined}
        />
          ))
        : null}
      {!loading && canEdit ? (
        <>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => void handleUpload(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            loading={uploading}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={12} />
            Dokumentum feltöltése
          </Button>
        </>
      ) : null}
    </div>
  );
}
