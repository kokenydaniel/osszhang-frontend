'use client';

import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Törlés',
  cancelText = 'Mégse',
  type = 'danger'
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-5 py-2">
        <div className="flex gap-4 items-start">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
            ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}
          `}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-2">
          <button 
            className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-colors
              ${type === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-brand-primary hover:bg-brand-light'}
            `}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
