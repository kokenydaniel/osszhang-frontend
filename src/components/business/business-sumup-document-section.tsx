'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionPanel } from '@/components/design';
import { BUSINESS_DOCUMENT_TYPES } from '@/config/business-documents';
import { AttachmentFileRow } from '@/components/attachments/attachment-file-row';
import { BusinessDocumentDropzone } from './business-document-dropzone';
import type { BusinessDocument } from '@/types/attachments';
import type { ConfirmDeleteOptions } from '@/hooks/useConfirmDelete';

type BusinessSumupDocumentSectionProps = {
  items: BusinessDocument[];
  canEdit: boolean;
  sumupConfigured: boolean;
  lastSyncedAt: string | null;
  loading: boolean;
  uploading: boolean;
  syncingSumup: boolean;
  downloadingDocId: number | null;
  downloadBusy: boolean;
  onSyncSumup: () => void;
  onManualUpload: () => void;
  onDownload: (doc: BusinessDocument) => void;
  onDelete: (doc: BusinessDocument) => void;
  requestDelete: (options: ConfirmDeleteOptions) => void;
  isDragging?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
};

export function BusinessSumupDocumentSection({
  items,
  canEdit,
  sumupConfigured,
  lastSyncedAt,
  loading,
  uploading,
  syncingSumup,
  downloadingDocId,
  downloadBusy,
  onSyncSumup,
  onManualUpload,
  onDownload,
  onDelete,
  requestDelete,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
}: BusinessSumupDocumentSectionProps) {
  const meta = BUSINESS_DOCUMENT_TYPES.find((t) => t.id === 'sumup_report')!;

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <SectionPanel title={meta.label} description={meta.hint} className="shadow-soft">
        {sumupConfigured ? (
          <p className="text-xs text-muted-foreground mb-3">
            {lastSyncedAt
              ? `Utolsó SumUp import: ${new Date(lastSyncedAt).toLocaleString('hu-HU')}`
              : 'Még nem futott automatikus SumUp import ebben a háztartásban.'}
          </p>
        ) : (
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
            Add meg a Merchant kódot és API kulcsot a Beállítások → Modulok → Vállalkozás menüben az automatikus importhoz.
          </p>
        )}

        {canEdit ? (
          <div className="mb-3">
            <Button
              type="button"
              size="sm"
              loading={syncingSumup}
              disabled={!sumupConfigured || syncingSumup || uploading}
              onClick={onSyncSumup}
              className="shadow-sm font-medium"
            >
              <RefreshCw size={13} className="mr-1.5" />
              Importálás SumUp rendszerből
            </Button>
          </div>
        ) : null}

        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">Még nincs SumUp dokumentum ebben a hónapban.</p>
          ) : (
            items.map((file) => (
              <AttachmentFileRow
                key={file.id}
                file={file}
                disabled={loading || syncingSumup || uploading || downloadBusy}
                downloading={downloadingDocId === file.id}
                onDownload={() => onDownload(file)}
                onDelete={
                  canEdit
                    ? () =>
                        requestDelete({
                          title: 'Dokumentum törlése',
                          message: `Biztosan törlöd: „${file.originalName}"?`,
                          onConfirm: () => onDelete(file),
                        })
                    : undefined
                }
              />
            ))
          )}
        </div>

        {canEdit ? (
          <BusinessDocumentDropzone
            onUploadClick={onManualUpload}
            loading={uploading}
            disabled={syncingSumup || uploading}
            isDragging={isDragging}
            title="Kézi SumUp jelentés feltöltése vagy behúzása"
            hint="Húzd ide a jelentést vagy kattints a tallózáshoz (PDF, XLS — max 20 MB)"
          />
        ) : null}
      </SectionPanel>
    </div>
  );
}
