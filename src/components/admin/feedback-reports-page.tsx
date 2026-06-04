'use client';

import { useMemo, useState } from 'react';
import { Download, MessageSquareWarning } from 'lucide-react';
import {
  PageHeader,
  DataTable,
  EmptyState,
  InsightBanner,
  StatusPill,
  type DataTableColumn,
} from '@/components/design';
import { Button } from '@/components/ui/button';
import { FeedbackReportDetailModal } from '@/components/feedback/feedback-report-detail-modal';
import { useAdminFeedbackReportsPageData } from '@/hooks/useAdminFeedbackReportsPageData';
import { downloadAuthenticatedFile } from '@/helpers/download-blob';
import { useNotificationStore } from '@/stores/useNotificationStore';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  FEEDBACK_STATUS_LABELS,
  feedbackCategoryLabel,
  type FeedbackCategory,
  type FeedbackStatus,
} from '@/config/feedback';
import type { FeedbackReport, FeedbackReportAttachment } from '@/types/feedback';
import { formatDisplayName } from '@/utils/person-name';

function attachmentDownloadPath(reportId: number, file: FeedbackReportAttachment): string {
  if (file.legacy || file.id <= 0) {
    return `admin/feedback-reports/${reportId}/legacy-attachment`;
  }
  return `admin/feedback-reports/attachments/${file.id}/download`;
}

export function FeedbackReportsPage() {
  const { addNotification } = useNotificationStore();
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('new');
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all');
  const [modalReport, setModalReport] = useState<FeedbackReport | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const { rows, attentionCount, loading, refreshing, refresh, updateStatus, loadDetail, sendReply } =
    useAdminFeedbackReportsPageData(statusFilter, categoryFilter);

  const attentionInList = useMemo(
    () => rows.filter((r) => r.needsAdminAttention).length,
    [rows],
  );

  const openReport = async (row: FeedbackReport) => {
    setModalReport(row);
    setModalLoading(true);
    try {
      const detail = await loadDetail(row.id);
      if (detail) setModalReport(detail);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDownload = async (row: FeedbackReport, file: FeedbackReportAttachment) => {
    const name = file.originalName ?? 'csatolmany';
    const key = `${row.id}-${file.id}`;
    setDownloadingKey(key);
    try {
      const ok = await downloadAuthenticatedFile(attachmentDownloadPath(row.id, file), name);
      if (!ok) addNotification('A letöltés nem sikerült.', 'error');
    } finally {
      setDownloadingKey(null);
    }
  };

  const columns: DataTableColumn<FeedbackReport>[] = [
    {
      key: 'when',
      header: 'Beküldve',
      cell: (row) => (
        <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleString('hu-HU') : '—'}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Típus',
      cell: (row) => (
        <span className="text-xs font-medium leading-snug max-w-[180px] block">
          {feedbackCategoryLabel(row.category)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Státusz',
      cell: (row) => (
        <StatusPill
          status={
            row.needsAdminAttention
              ? 'warning'
              : row.status === 'resolved'
                ? 'success'
                : row.status === 'replied'
                  ? 'info'
                  : 'neutral'
          }
          size="xs"
        >
          {row.needsAdminAttention ? 'Várakozik' : FEEDBACK_STATUS_LABELS[row.status]}
        </StatusPill>
      ),
    },
    {
      key: 'user',
      header: 'Felhasználó',
      cell: (row) => (
        <span className="text-sm">
          {row.user
            ? formatDisplayName(row.user.firstName, row.user.lastName) || row.user.username
            : '—'}
        </span>
      ),
    },
    {
      key: 'household',
      header: 'Háztartás',
      cell: (row) => <span className="text-sm truncate max-w-[140px] block">{row.household?.name ?? '—'}</span>,
    },
    {
      key: 'subject',
      header: 'Tárgy',
      cell: (row) => (
        <button
          type="button"
          className="text-left text-sm font-medium hover:text-primary truncate max-w-[200px] block"
          onClick={() => void openReport(row)}
        >
          {row.subject?.trim() || '(nincs tárgy)'}
        </button>
      ),
    },
    {
      key: 'file',
      header: 'Csatolmány',
      cell: (row) =>
        row.attachments.length > 0 ? (
          <div className="flex flex-col gap-1">
            {row.attachments.map((file) => {
              const key = `${row.id}-${file.id}`;
              return (
                <Button
                  key={key}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs justify-start px-1"
                  loading={downloadingKey === key}
                  disabled={downloadingKey !== null}
                  onClick={() => void handleDownload(row, file)}
                >
                  <Download size={12} />
                  <span className="truncate max-w-[120px]">{file.originalName ?? 'fájl'}</span>
                </Button>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Platform admin', href: '/admin/users' },
          { label: 'Bejelentések' },
        ]}
        title="Felhasználói bejelentések"
        description="Hibák, funkciókérések, ötletek — csak platform admin láthatja."
        actions={
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            Frissítés
          </button>
        }
      />

      <InsightBanner tone="info" icon={MessageSquareWarning} title="Felhasználói visszajelzések">
        A felhasználók a bal oldali menü alján, a „Visszajelzés” menüpontból küldenek bejelentést.
        {attentionCount > 0
          ? ` ${attentionCount} bejelentés vár kezelésre (új vagy felhasználói válasz).`
          : null}
        {statusFilter === 'new' && attentionInList > 0 ? ` Ebből ${attentionInList} látszik a szűrt listában.` : null}
      </InsightBanner>

      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Státusz:</span>
          <select
            className="h-9 rounded-md border border-border bg-input px-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | 'all')}
          >
            <option value="all">Összes</option>
            {FEEDBACK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {FEEDBACK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Típus:</span>
          <select
            className="h-9 rounded-md border border-border bg-input px-2 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as FeedbackCategory | 'all')}
          >
            <option value="all">Összes</option>
            {FEEDBACK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {feedbackCategoryLabel(c)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-12 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          minWidth="960px"
          empty={
            <EmptyState
              icon={MessageSquareWarning}
              title="Nincs bejelentés"
              description="Még nem érkezett ilyen szűrésű visszajelzés."
            />
          }
        />
      )}

      <FeedbackReportDetailModal
        isOpen={modalReport !== null}
        onClose={() => setModalReport(null)}
        report={modalReport}
        mode="admin"
        loading={modalLoading}
        attachmentDownloadPath={attachmentDownloadPath}
        onStatusChange={async (status) => {
          if (!modalReport) return false;
          const updated = await updateStatus(modalReport.id, status);
          if (updated) {
            setModalReport(updated);
            return true;
          }
          addNotification('A státusz mentése nem sikerült.', 'error');
          return false;
        }}
        onSendReply={async (body) => {
          if (!modalReport) return false;
          const updated = await sendReply(modalReport.id, body);
          if (updated) {
            setModalReport(updated);
            addNotification('Válasz elküldve.', 'success');
            return true;
          }
          addNotification('A válasz küldése nem sikerült.', 'error');
          return false;
        }}
      />
    </div>
  );
}
