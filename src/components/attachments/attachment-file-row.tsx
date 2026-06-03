'use client';

import { Download, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/utils/format-bytes';
import type { FileAttachment } from '@/types/attachments';

type AttachmentFileRowProps = {
  file: FileAttachment & { source?: string; label?: string | null };
  onDownload: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  downloading?: boolean;
};

export function AttachmentFileRow({
  file,
  onDownload,
  onDelete,
  disabled,
  downloading = false,
}: AttachmentFileRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2">
      <FileText size={16} className="shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">{file.originalName}</p>
        <p className="text-[0.65rem] text-muted-foreground">
          {formatBytes(file.sizeBytes)}
          {file.source === 'sumup' ? ' · SumUp import' : ''}
          {file.label ? ` · ${file.label}` : ''}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Letöltés"
        loading={downloading}
        disabled={disabled || downloading}
        onClick={onDownload}
      >
        <Download size={14} />
      </Button>
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          aria-label="Törlés"
          disabled={disabled}
          onClick={onDelete}
        >
          <Trash2 size={14} />
        </Button>
      ) : null}
    </div>
  );
}
