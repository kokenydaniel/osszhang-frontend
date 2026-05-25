'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedHeight } from '@/components/ui/AnimatedHeight';
import classNames from 'classnames';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  contentKey?: string | number;
  animateContent?: boolean;
  dismissible?: boolean;
  overlayZIndex?: number;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  icon,
  description,
  size = 'md',
  contentKey,
  animateContent = true,
  dismissible = true,
  overlayZIndex = 400,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, dismissible]);

  if (!mounted || !isOpen) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }[size];

  return createPortal(
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      style={{ zIndex: overlayZIndex, background: 'oklch(0.22 0.015 260 / 40%)' }}
      onClick={dismissible ? onClose : undefined}
      role="presentation"
    >
      <div
        className={classNames(
          'w-full flex flex-col bg-card border border-border shadow-xl',
          'max-h-[min(92dvh,100%)] sm:max-h-[90vh] sm:rounded-xl rounded-t-xl',
          'animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200',
          'transition-[max-width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          sizeClass,
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="relative shrink-0 border-b border-border bg-gradient-to-br from-primary/[0.06] via-card to-card">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
          />
          <div className="flex items-start gap-3 px-5 py-4 pr-14">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary shadow-sm border border-primary/15">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 id="modal-title" className="text-base font-semibold tracking-tight text-foreground leading-snug">
                {title}
              </h2>
              {description && (
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-prose">{description}</p>
              )}
            </div>
          </div>
          {dismissible && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
              onClick={onClose}
              aria-label="Bezárás"
            >
              <X size={18} />
            </Button>
          )}
        </div>
        <div className="px-5 py-5 overflow-y-auto overflow-x-hidden overscroll-contain min-h-0 flex-1">
          {animateContent ? (
            <AnimatedHeight contentKey={contentKey}>{children}</AnimatedHeight>
          ) : (
            children
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
