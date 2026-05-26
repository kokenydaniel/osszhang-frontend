'use client';

import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';
import classNames from 'classnames';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  overlayZIndex?: number;
  confirmLoading?: boolean;
}

export function ConfirmModal({
  isOpen, onClose, onConfirm, title, message,
  confirmText = 'Törlés', cancelText = 'Mégse', type = 'danger',
  overlayZIndex,
  confirmLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} overlayZIndex={overlayZIndex}>
      <div className="flex flex-col gap-4 py-1">
        <div className="flex gap-3 items-start">
          <div className={classNames(
            'h-9 w-9 rounded-md flex items-center justify-center shrink-0',
            type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700',
          )}>
            <AlertTriangle size={18} />
          </div>
          <p className="text-sm text-foreground leading-relaxed pt-1">{message}</p>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={type === 'danger' ? 'destructive' : 'default'}
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={() => void onConfirm()}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
