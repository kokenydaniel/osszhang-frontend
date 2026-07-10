'use client';

import React from 'react';
import classNames from 'classnames';
import { Upload, FileUp, Loader2 } from 'lucide-react';

export interface BusinessDocumentDropzoneProps {
  onUploadClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  isDragging?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  title?: string;
  hint?: string;
}

export function BusinessDocumentDropzone({
  onUploadClick,
  loading = false,
  disabled = false,
  isDragging = false,
  onDragOver,
  onDragLeave,
  onDrop,
  title = 'Fájl feltöltése vagy behúzása',
  hint = 'Húzd ide az egereddel, vagy kattints a tallózáshoz (PDF, JPG, PNG, XLS, CSV — max 20 MB)',
}: BusinessDocumentDropzoneProps) {
  return (
    <div
      onClick={disabled || loading ? undefined : onUploadClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && !loading) {
          e.preventDefault();
          onUploadClick();
        }
      }}
      className={classNames(
        'group relative flex items-center justify-between gap-3 rounded-xl border-2 border-dashed p-4 text-left transition-all duration-200 select-none cursor-pointer mt-3',
        isDragging
          ? 'border-primary bg-primary/10 shadow-md scale-[1.005] ring-2 ring-primary/20 ring-offset-1 dark:bg-primary/15'
          : disabled || loading
            ? 'border-border/40 bg-muted/10 opacity-60 cursor-not-allowed'
            : 'border-border/70 hover:border-primary/60 bg-muted/20 hover:bg-primary/[0.03] dark:hover:bg-primary/[0.05] shadow-2xs hover:shadow-sm',
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0 w-full">
        <div
          className={classNames(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
            isDragging
              ? 'bg-primary text-primary-foreground scale-110 shadow-sm'
              : 'bg-primary/10 text-primary group-hover:bg-primary/15 group-hover:scale-105',
          )}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-primary" />
          ) : isDragging ? (
            <FileUp size={20} strokeWidth={2.2} />
          ) : (
            <Upload size={18} strokeWidth={2.2} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
            <span>{loading ? 'Feltöltés folyamatban...' : title}</span>
          </div>
          <div className="text-[0.75rem] text-muted-foreground truncate sm:whitespace-normal">
            {hint}
          </div>
        </div>
      </div>
    </div>
  );
}
