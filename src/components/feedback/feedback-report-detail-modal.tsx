'use client';

import { useEffect, useState } from 'react';
import { Download, MessageSquareWarning } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/design';
import { downloadAuthenticatedFile } from '@/helpers/download-blob';
import {
  FEEDBACK_STATUSES,
  FEEDBACK_STATUS_LABELS,
  feedbackCategoryLabel,
  feedbackUserStatusLabel,
  type FeedbackStatus,
} from '@/config/feedback';
import type { FeedbackReport, FeedbackReportAttachment } from '@/types/feedback';
import { formatBytes } from '@/utils/format-bytes';
import { formatDisplayName } from '@/utils/person-name';

type FeedbackReportDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  report: FeedbackReport | null;
  mode: 'admin' | 'user';
  loading?: boolean;
  onStatusChange?: (status: FeedbackStatus) => Promise<boolean>;
  onSendReply: (body: string) => Promise<boolean>;
  attachmentDownloadPath: (reportId: number, file: FeedbackReportAttachment) => string;
};

export function FeedbackReportDetailModal({
  isOpen,
  onClose,
  report,
  mode,
  loading = false,
  onStatusChange,
  onSendReply,
  attachmentDownloadPath,
}: FeedbackReportDetailModalProps) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setReply('');
  }, [isOpen, report?.id]);

  if (!report) return null;

  const handleDownload = async (file: FeedbackReportAttachment) => {
    const name = file.originalName ?? 'csatolmany';
    const key = `${report.id}-${file.id}`;
    setDownloadingKey(key);
    try {
      await downloadAuthenticatedFile(attachmentDownloadPath(report.id, file), name);
    } finally {
      setDownloadingKey(null);
    }
  };

  const submitReply = async () => {
    const trimmed = reply.trim();
    if (trimmed.length < 2) return;
    setSending(true);
    try {
      const ok = await onSendReply(trimmed);
      if (ok) setReply('');
    } finally {
      setSending(false);
    }
  };

  const statusLabel =
    mode === 'user'
      ? feedbackUserStatusLabel(report.status, report.hasUnreadReply)
      : FEEDBACK_STATUS_LABELS[report.status];

  const statusTone =
    report.status === 'resolved'
      ? 'success'
      : report.hasUnreadReply || report.status === 'new'
        ? 'warning'
        : report.status === 'replied'
          ? 'info'
          : 'neutral';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={report.subject?.trim() || 'Bejelentés'}
      icon={<MessageSquareWarning size={18} />}
      description={feedbackCategoryLabel(report.category)}
      size="lg"
      contentKey={report.id}
    >
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={statusTone} size="xs">
            {statusLabel}
          </StatusPill>
          {report.createdAt ? (
            <span className="text-xs text-muted-foreground">
              {new Date(report.createdAt).toLocaleString('hu-HU')}
            </span>
          ) : null}
          {mode === 'admin' && report.user ? (
            <span className="text-xs text-muted-foreground">
              {formatDisplayName(report.user.firstName, report.user.lastName) || report.user.username}
              {report.household?.name ? ` · ${report.household.name}` : ''}
            </span>
          ) : null}
        </div>

        {mode === 'admin' ? (
          <label className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Státusz:</span>
            <select
              className="h-8 rounded-md border border-border bg-input px-2 text-xs"
              value={report.status}
              disabled={loading}
              onChange={(e) => {
                const next = e.target.value as FeedbackStatus;
                void onStatusChange?.(next);
              }}
            >
              {FEEDBACK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {FEEDBACK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="rounded-md border border-border bg-muted/20 p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {mode === 'admin' ? 'Eredeti bejelentés' : 'Te írtad'}
          </p>
          <p className="whitespace-pre-wrap">{report.message}</p>
        </div>

        {report.messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.author === 'admin'
                ? 'rounded-md border border-primary/30 bg-primary/5 p-3 ml-0 mr-4'
                : 'rounded-md border border-border bg-muted/20 p-3 ml-4 mr-0'
            }
          >
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {msg.author === 'admin'
                ? 'Válasz a PenzPilot csapattól'
                : mode === 'admin'
                  ? 'Felhasználó pontosítása'
                  : 'Te pontosítottál'}
              {msg.createdAt ? ` · ${new Date(msg.createdAt).toLocaleString('hu-HU')}` : ''}
            </p>
            <p className="whitespace-pre-wrap">{msg.body}</p>
          </div>
        ))}

        {report.pageUrl ? (
          <p className="text-xs">
            <span className="text-muted-foreground">Oldal: </span>
            <a href={report.pageUrl} className="text-primary hover:underline break-all" target="_blank" rel="noreferrer">
              {report.pageUrl}
            </a>
          </p>
        ) : null}

        {report.attachments.length > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">Csatolmányok</p>
            {report.attachments.map((file) => {
              const key = `${report.id}-${file.id}`;
              const path = attachmentDownloadPath(report.id, file);
              if (!path) {
                return (
                  <p key={key} className="text-xs text-muted-foreground">
                    {file.originalName ?? 'fájl'} ({formatBytes(file.sizeBytes)})
                  </p>
                );
              }
              return (
                <Button
                  key={key}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start px-1 text-xs"
                  loading={downloadingKey === key}
                  disabled={downloadingKey !== null}
                  onClick={() => void handleDownload(file)}
                >
                  <Download size={12} />
                  <span className="truncate">
                    {file.originalName ?? 'fájl'} ({formatBytes(file.sizeBytes)})
                  </span>
                </Button>
              );
            })}
          </div>
        ) : null}

        {report.status !== 'resolved' ? (
          <div className="border-t border-border pt-3 space-y-2">
            <label className="text-xs font-medium text-foreground">
              {mode === 'admin' ? 'Válasz a felhasználónak' : 'Pontosítás / kiegészítés'}
            </label>
            <textarea
              className="w-full min-h-[88px] rounded-md border border-border bg-input px-3 py-2 text-sm resize-y"
              placeholder={
                mode === 'admin'
                  ? 'Írd meg a választ — a felhasználó a Visszajelzés oldalon látja.'
                  : 'Ha kell, írj további részleteket…'
              }
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={sending || loading}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Bezárás
              </Button>
              <Button
                type="button"
                size="sm"
                loading={sending}
                disabled={reply.trim().length < 2 || loading}
                onClick={() => void submitReply()}
              >
                {mode === 'admin' ? 'Válasz küldése' : 'Üzenet küldése'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            Ez a bejelentés le van zárva. Új üzenet nem küldhető.
          </p>
        )}
      </div>
    </Modal>
  );
}
