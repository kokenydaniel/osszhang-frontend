'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 md:p-6 animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg max-h-[90vh] bg-slate-900 border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-white/5">
          <div className="text-lg font-black text-white">{title}</div>
          <button 
            className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors" 
            onClick={onClose} 
            aria-label="Bezárás"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
