'use client';

import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { Archive, Download, Info, Upload } from 'lucide-react';
import { resolveBusinessSettings } from '@/settings/business';
import { SectionPanel, InsightBanner, AccentPanel } from '@/components/design';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { BUSINESS_DOCUMENT_TYPES } from '@/config/business-documents';
import { useBusinessDocuments } from '@/hooks/useBusinessDocuments';
import { isPlatformFeatureEnabled } from '@/config/platform-feature-flags';
import { canUseFeature } from '@/helpers/check-access';
import { canEditHousehold } from '@/utils/household-role';
import { formatHUF } from '@/utils';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { BusinessOrder } from '@/types/business';
import type { BusinessDocumentType } from '@/types/attachments';
import type { UserProfile } from '@/types';
import { AttachmentFileRow } from '@/components/attachments/attachment-file-row';
import { BusinessSumupDocumentSection } from './business-sumup-document-section';
import { BusinessDocumentDropzone } from './business-document-dropzone';
import type { ConfirmDeleteOptions } from '@/hooks/useConfirmDelete';

type BusinessDocumentsTabProps = {
  selectedYear: number;
  selectedMonth: number;
  filteredOrders: BusinessOrder[];
  user: UserProfile | null;
  requestDelete: (options: ConfirmDeleteOptions) => void;
  onDocumentCoverageChange?: (year: number, month: number, hasDocs: boolean) => void;
};

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'xls', 'xlsx', 'csv'];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export function BusinessDocumentsTab({
  selectedYear,
  selectedMonth,
  filteredOrders,
  user,
  requestDelete,
  onDocumentCoverageChange,
}: BusinessDocumentsTabProps) {
  const docs = useBusinessDocuments(selectedYear, selectedMonth);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [linkOrderId, setLinkOrderId] = useState<string>('');
  const [dragOverType, setDragOverType] = useState<BusinessDocumentType | null>(null);

  useEffect(() => {
    if (!docs.loading) {
      onDocumentCoverageChange?.(selectedYear, selectedMonth, docs.documents.length > 0);
    }
  }, [docs.documents.length, docs.loading, onDocumentCoverageChange, selectedMonth, selectedYear]);

  const handleDragOver = (e: React.DragEvent, type: BusinessDocumentType) => {
    e.preventDefault();
    e.stopPropagation();
    if (canEditHousehold(user)) setDragOverType(type);
  };

  const handleDragLeave = (e: React.DragEvent, type: BusinessDocumentType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverType((prev) => (prev === type ? null : prev));
  };

  const handleDrop = (e: React.DragEvent, type: BusinessDocumentType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverType(null);
    if (canEditHousehold(user) && e.dataTransfer.files?.length) {
      void handleFile(type, e.dataTransfer.files);
    }
  };

  const enabled =
    isPlatformFeatureEnabled(user, 'enable_attachments') && canUseFeature(user, 'attachments');
  const canEdit = canEditHousehold(user);
  const monthLabel = `${selectedYear}. ${String(selectedMonth).padStart(2, '0')}.`;
  const bizSettings = resolveBusinessSettings(user?.household ?? null);
  const sumupConfigured =
    Boolean(user?.household?.sumup_import_enabled) &&
    Boolean(user?.household?.sumup_merchant_code?.trim()) &&
    Boolean(user?.household?.has_sumup_api_key);
  const sumupAllowed = canUseFeature(user, 'sumup_import');

  const triggerUpload = (type: BusinessDocumentType) => {
    fileInputs.current[type]?.click();
  };

  const handleFile = async (type: BusinessDocumentType, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      useNotificationStore.getState().addNotification(
        `Nem engedélyezett fájltípus (.${ext}). Engedélyezett: PDF, JPG, PNG, WEBP, XLS, XLSX, CSV.`,
        'error',
      );
      if (fileInputs.current[type]) fileInputs.current[type]!.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      useNotificationStore.getState().addNotification(
        'A fájl mérete nem haladhatja meg a 20 MB-ot.',
        'error',
      );
      if (fileInputs.current[type]) fileInputs.current[type]!.value = '';
      return;
    }

    const orderId =
      type === 'market_receipt' && linkOrderId ? Number(linkOrderId) : undefined;
    await docs.upload({
      documentType: type,
      file,
      businessOrderId: orderId,
    });
    if (fileInputs.current[type]) fileInputs.current[type]!.value = '';
  };

  if (!enabled) {
    return (
      <InsightBanner tone="info" icon={Info} title="Dokumentumok — Premium">
        A havi könyvelési csomag és nyugták feltöltése Premium előfizetéssel és platform kapcsolóval érhető el.
      </InsightBanner>
    );
  }

  const totalCount = docs.documents.length;
  const downloadBusy = docs.downloadingBundle || docs.downloadingDocId !== null;

  return (
    <div className="flex flex-col gap-5">
      <AccentPanel tone="primary" icon={Archive} title={`Könyvelési csomag — ${monthLabel}`}>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Töltsd fel a hónap dokumentumait (bank, SumUp, Barion, piaci nyugták), majd egy ZIP-ben küldd a könyvelőnek.
          A SumUp-ból automatikusan is importálhatsz tranzakció- és kifizetés-kimutatást — a kézi feltöltés továbbra is megmarad.
        </p>
        <Button
          type="button"
          onClick={() => void docs.downloadBundle()}
          loading={docs.downloadingBundle}
          disabled={totalCount === 0 || docs.downloadingBundle}
        >
          <Download size={14} />
          Teljes csomag letöltése ({totalCount} fájl)
        </Button>
      </AccentPanel>

      <input
        ref={(el) => {
          fileInputs.current.sumup_report = el;
        }}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.csv"
        onChange={(e) => void handleFile('sumup_report', e.target.files)}
      />

      {BUSINESS_DOCUMENT_TYPES.map((meta) => {
        const items = docs.byType(meta.id);
        const isMarket = meta.id === 'market_receipt';

        if (meta.id === 'sumup_report') {
          return (
            <BusinessSumupDocumentSection
              key={meta.id}
              items={items}
              canEdit={canEdit}
              sumupConfigured={sumupConfigured && sumupAllowed}
              lastSyncedAt={bizSettings.sumup_last_synced_at}
              loading={docs.loading}
              uploading={docs.uploadingType === 'sumup_report'}
              syncingSumup={docs.syncingSumup}
              downloadingDocId={docs.downloadingDocId}
              downloadBusy={downloadBusy}
              onSyncSumup={() => void docs.syncSumup()}
              onManualUpload={() => triggerUpload('sumup_report')}
              onDownload={(file) => void docs.downloadOne(file)}
              onDelete={(file) => void docs.remove(file.id)}
              requestDelete={requestDelete}
              isDragging={dragOverType === 'sumup_report'}
              onDragOver={(e) => handleDragOver(e, 'sumup_report')}
              onDragLeave={(e) => handleDragLeave(e, 'sumup_report')}
              onDrop={(e) => handleDrop(e, 'sumup_report')}
            />
          );
        }

        return (
          <div
            key={meta.id}
            onDragOver={(e) => handleDragOver(e, meta.id)}
            onDragLeave={(e) => handleDragLeave(e, meta.id)}
            onDrop={(e) => handleDrop(e, meta.id)}
          >
            <SectionPanel
              title={meta.label}
              description={meta.hint}
              className="shadow-soft"
            >
            {isMarket && canEdit && filteredOrders.length > 0 ? (
              <div className="mb-3 max-w-md space-y-1">
                <FieldLabel>Kapcsolódó rendelés (opcionális)</FieldLabel>
                <select
                  className="w-full h-9 rounded-md border border-border bg-input px-2 text-sm"
                  value={linkOrderId}
                  onChange={(e) => setLinkOrderId(e.target.value)}
                >
                  <option value="">Nincs rendeléshez kötve</option>
                  {filteredOrders.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.customerName} — {formatHUF(o.amount)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-2 mb-3">
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground">Még nincs feltöltve.</p>
              ) : (
                items.map((file) => (
                  <AttachmentFileRow
                    key={file.id}
                    file={file}
                    disabled={docs.loading || docs.uploadingType !== null || downloadBusy}
                    downloading={docs.downloadingDocId === file.id}
                    onDownload={() => void docs.downloadOne(file)}
                    onDelete={
                      canEdit
                        ? () =>
                            requestDelete({
                              title: 'Dokumentum törlése',
                              message: `Biztosan törlöd: „${file.originalName}"?`,
                              onConfirm: async () => {
                                await docs.remove(file.id);
                              },
                            })
                        : undefined
                    }
                  />
                ))
              )}
            </div>

            {canEdit ? (
              <>
                <input
                  ref={(el) => {
                    fileInputs.current[meta.id] = el;
                  }}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.csv"
                  onChange={(e) => void handleFile(meta.id, e.target.files)}
                />
                <BusinessDocumentDropzone
                  onUploadClick={() => triggerUpload(meta.id)}
                  loading={docs.uploadingType === meta.id}
                  disabled={docs.uploadingType !== null}
                  isDragging={dragOverType === meta.id}
                  title="Fájl feltöltése vagy behúzása"
                  hint="Húzd ide az egereddel, vagy kattints a tallózáshoz (PDF, Kép, Excel, CSV — max 20 MB)"
                />
              </>
            ) : null}
            </SectionPanel>
          </div>
        );
      })}
    </div>
  );
}
