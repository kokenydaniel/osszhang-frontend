'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, Paperclip, Upload, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { PageHeader, InsightBanner, StatusPill } from '@/components/design';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { FeedbackReportDetailModal } from '@/components/feedback/feedback-report-detail-modal';
import { feedbackClient } from '@/lib/api-client';
import { useNotificationStore } from '@/stores/useNotificationStore';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_HINTS,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_MAX_FILES,
  feedbackCategoryLabel,
  feedbackUserStatusLabel,
  type FeedbackCategory,
} from '@/config/feedback';
import type { FeedbackReport, FeedbackReportAttachment } from '@/types/feedback';

function userAttachmentPath(_reportId: number, file: FeedbackReportAttachment): string {
  if (file.legacy || file.id <= 0) {
    return '';
  }

  return `feedback-reports/attachments/${file.id}/download`;
}

export function FeedbackPage() {
  const pathname = usePathname();
  const { addNotification } = useNotificationStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const [mine, setMine] = useState<FeedbackReport[]>([]);
  const [mineLoading, setMineLoading] = useState(true);
  const [modalReport, setModalReport] = useState<FeedbackReport | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const loadMine = useCallback(async () => {
    setMineLoading(true);
    try {
      const res = await feedbackClient.listMine();
      if (res) setMine(res.items);
    } finally {
      setMineLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  const openReport = async (row: FeedbackReport) => {
    setModalReport(row);
    setModalLoading(true);
    try {
      const detail = await feedbackClient.show(row.id);
      if (detail) {
        setModalReport(detail);
        setMine((prev) => prev.map((r) => (r.id === detail.id ? detail : r)));
      }
    } finally {
      setModalLoading(false);
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setFiles((prev) => {
      const next = [...prev];
      for (const file of Array.from(list)) {
        if (next.length >= FEEDBACK_MAX_FILES) break;
        if (!next.some((f) => f.name === file.name && f.size === file.size)) {
          next.push(file);
        }
      }
      return next.slice(0, FEEDBACK_MAX_FILES);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      addNotification('Írd le részletesebben (legalább 10 karakter).', 'error');
      return;
    }

    setSending(true);
    try {
      const pageUrl =
        typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : pathname;
      const res = await feedbackClient.submit({
        category,
        message: trimmed,
        subject: subject.trim() || undefined,
        pageUrl,
        files,
      });
      if (!res) {
        addNotification('A bejelentés küldése nem sikerült.', 'error');
        return;
      }
      if (!res.success) {
        addNotification(res.message, 'error');
        return;
      }
      const attachmentNote =
        res.data.attachments?.length > 0
          ? ` (${res.data.attachments.length} csatolmánnyal)`
          : '';
      addNotification(`Köszönjük! A bejelentésed megérkezett${attachmentNote}.`, 'success');
      setSubject('');
      setMessage('');
      setFiles([]);
      void loadMine();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-7 w-full max-w-[720px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Visszajelzés' }]}
        title="Hibabejelentés és visszajelzés"
        description="Írd le, mi történt vagy mit szeretnél — több képernyőképet is csatolhatsz."
      />

      <InsightBanner tone="info" icon={MessageSquarePlus} title="Mire jó ez?">
        Segít fejleszteni az Összhangot: hibák, új funkciók, javítási ötletek és kérdések. A válaszokat itt,
        a „Korábbi bejelentéseim” alatt látod — pontosítást is küldhetsz.
      </InsightBanner>

      <form onSubmit={(e) => void submit(e)} className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-soft">
        <FormField label="Mi a helyzet?">
          <select
            className="h-9 w-full rounded-md border border-border bg-input px-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
          >
            {FEEDBACK_CATEGORIES.map((id) => (
              <option key={id} value={id}>
                {FEEDBACK_CATEGORY_LABELS[id]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1.5">{FEEDBACK_CATEGORY_HINTS[category]}</p>
        </FormField>

        <FormField label="Rövid tárgy (opcionális)">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Pl. Költségvetés — nyugta feltöltés"
            maxLength={200}
          />
        </FormField>

        <FormField label="Részletes leírás" hint="Min. 10 karakter.">
          <textarea
            className="min-h-[140px] w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Írd le pontosan mit csináltál, mit vártál, mit látsz…"
            maxLength={5000}
            required
          />
        </FormField>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider">
            <Paperclip size={12} />
            Csatolmányok (opcionális, max. {FEEDBACK_MAX_FILES} fájl)
          </div>
          <p className="text-xs text-muted-foreground">Képernyőkép, PDF — egyenként max. 10 MB.</p>
          {files.length > 0 ? (
            <ul className="space-y-1">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/80 bg-muted/30 px-2.5 py-1.5 text-xs"
                >
                  <span className="truncate font-medium">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 h-7 w-7"
                    aria-label="Eltávolítás"
                    onClick={() => removeFile(index)}
                  >
                    <X size={12} />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          <label
            className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors ${
              files.length >= FEEDBACK_MAX_FILES
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:bg-muted'
            }`}
          >
            <Upload size={12} />
            Fájlok hozzáadása
            <input
              ref={fileRef}
              type="file"
              className="sr-only"
              multiple
              disabled={files.length >= FEEDBACK_MAX_FILES}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,application/pdf,image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
        </div>

        <Button type="submit" loading={sending} disabled={sending} className="w-full sm:w-auto">
          <MessageSquarePlus size={14} />
          Bejelentés küldése
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Korábbi bejelentéseim</h2>
        {mineLoading ? (
          <div className="rounded-lg border border-border bg-card p-8 flex justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">Még nincs korábbi bejelentésed.</p>
        ) : (
          <ul className="rounded-xl border border-border bg-card divide-y divide-border">
            {mine.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors"
                  onClick={() => void openReport(row)}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">
                      {row.subject?.trim() || feedbackCategoryLabel(row.category)}
                    </span>
                    <StatusPill
                      status={row.hasUnreadReply ? 'warning' : row.status === 'resolved' ? 'success' : 'neutral'}
                      size="xs"
                    >
                      {feedbackUserStatusLabel(row.status, row.hasUnreadReply)}
                    </StatusPill>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{row.message}</p>
                  {row.createdAt ? (
                    <p className="text-[0.65rem] text-muted-foreground mt-1">
                      {new Date(row.createdAt).toLocaleString('hu-HU')}
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FeedbackReportDetailModal
        isOpen={modalReport !== null}
        onClose={() => {
          setModalReport(null);
          void loadMine();
        }}
        report={modalReport}
        mode="user"
        loading={modalLoading}
        attachmentDownloadPath={userAttachmentPath}
        onSendReply={async (body) => {
          if (!modalReport) return false;
          const updated = await feedbackClient.sendMessage(modalReport.id, body);
          if (updated) {
            setModalReport(updated);
            setMine((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            addNotification('Üzenet elküldve.', 'success');
            return true;
          }
          addNotification('Az üzenet küldése nem sikerült.', 'error');
          return false;
        }}
      />
    </div>
  );
}
