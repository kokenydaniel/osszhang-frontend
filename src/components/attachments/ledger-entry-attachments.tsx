'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Paperclip, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { attachmentsClient } from '@/lib/api-client';
import { downloadAuthenticatedFile } from '@/helpers/download-blob';
import { StatusCodes } from '@/types/api';
import { isPlatformFeatureEnabled } from '@/config/platform-feature-flags';
import { canUseFeature } from '@/helpers/check-access';
import { useAuthStore } from '@/stores/useAuthStore';
import type { FileAttachment } from '@/types/attachments';
import { AttachmentFileRow } from './attachment-file-row';

type LedgerEntryAttachmentsProps = {
  ledgerEntryId: number;
  compact?: boolean;
};

export function LedgerEntryAttachments({ ledgerEntryId, compact }: LedgerEntryAttachmentsProps) {
  const user = useAuthStore((s) => s.user);
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const enabled =
    isPlatformFeatureEnabled(user, 'enable_attachments') && canUseFeature(user, 'attachments');

  const refresh = useCallback(async () => {
    if (!enabled || ledgerEntryId <= 0) return;
    setLoading(true);
    try {
      const res = await attachmentsClient.listForLedger(ledgerEntryId);
      if (res && res[0] === StatusCodes.Http200) {
        setFiles(res[1] ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, ledgerEntryId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file || !enabled) return;
    setUploading(true);
    try {
      const res = await attachmentsClient.uploadToLedger(ledgerEntryId, file);
      if (res && res[0] === StatusCodes.Http201) {
        await refresh();
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (attachmentId: number) => {
    const res = await attachmentsClient.deleteAttachment(attachmentId);
    if (res && res[0] === StatusCodes.Http200) {
      setFiles((prev) => prev.filter((f) => f.id !== attachmentId));
    }
  };

  if (!enabled) {
    return compact ? null : (
      <p className="text-[0.65rem] text-muted-foreground">Nyugta csatolás Premium csomagban érhető el.</p>
    );
  }

  return (
    <div className={compact ? 'mt-1.5 space-y-1' : 'space-y-2'}>
      {!compact ? (
        <div className="flex items-center gap-1.5 text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider">
          <Paperclip size={12} />
          Nyugták
        </div>
      ) : null}
      {files.map((file) => (
        <AttachmentFileRow
          key={file.id}
          file={file}
          disabled={loading || uploading || downloadingId !== null}
          downloading={downloadingId === file.id}
          onDownload={() => {
            setDownloadingId(file.id);
            void downloadAuthenticatedFile(`attachments/${file.id}/download`, file.originalName).finally(
              () => setDownloadingId(null),
            );
          }}
          onDelete={() => void handleDelete(file.id)}
        />
      ))}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
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
        Nyugta feltöltése
      </Button>
    </div>
  );
}
