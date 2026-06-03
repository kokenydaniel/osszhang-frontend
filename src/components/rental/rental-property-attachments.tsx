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
import type { FileAttachment } from '@/types/attachments';
import { AttachmentFileRow } from '@/components/attachments/attachment-file-row';

type Props = {
  propertyId: number;
  canEdit?: boolean;
  onCountChange?: (count: number) => void;
};

export function RentalPropertyAttachments({ propertyId, canEdit = true, onCountChange }: Props) {
  const user = useAuthStore((s) => s.user);
  const inputRef = useRef<HTMLInputElement>(null);
  const onCountChangeRef = useRef(onCountChange);
  onCountChangeRef.current = onCountChange;

  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const enabled =
    isPlatformFeatureEnabled(user, 'enable_attachments') && canUseFeature(user, 'attachments');

  const refresh = useCallback(async () => {
    if (!enabled || propertyId <= 0) return;
    setLoading(true);
    try {
      const res = await attachmentsClient.listForRentalProperty(propertyId);
      if (res && res[0] === StatusCodes.Http200) {
        const list = res[1] ?? [];
        setFiles(list);
        onCountChangeRef.current?.(list.length);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, propertyId]);

  useEffect(() => {
    void refresh();
  }, [propertyId, enabled, refresh]);

  const handleUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file || !enabled || !canEdit) return;
    setUploading(true);
    try {
      const res = await attachmentsClient.uploadToRentalProperty(propertyId, file);
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
        A szerződés feltöltéséhez csatolás funkció és Premium szükséges.
      </p>
    );
  }

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <div className="flex items-center gap-1.5 text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider">
        <FileText size={12} />
        Szerződés / mellékletek
      </div>
      <p className="text-xs text-muted-foreground">Pl. bérleti szerződés, kauciós megállapodás — PDF.</p>
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
          onDelete={canEdit ? () => void handleDelete(file.id) : undefined}
        />
      ))}
      {canEdit ? (
        <>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,application/pdf"
            onChange={(e) => void handleUpload(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={14} />
            {uploading ? 'Feltöltés…' : 'Szerződés feltöltése'}
          </Button>
        </>
      ) : null}
    </div>
  );
}
