'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  overflowVisible?: boolean;
  icon?: ReactNode;
  description?: string;
}

export function Modal({ isOpen, onClose, title, children, overflowVisible = false, icon, description }: ModalProps) {
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
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200" 
      style={{ background: 'rgba(7, 10, 19, 0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-lg max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'}`} 
        style={{
          background: 'rgba(18, 23, 36, 0.98)',
          border: '1px solid rgba(129,140,248,0.12)',
          borderRadius: '24px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-5 md:p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {icon && (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-brand-primary" style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.2)' }}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-base font-black text-white">{title}</div>
            {description && <div className="text-xs text-slate-500 mt-0.5 font-medium">{description}</div>}
          </div>
          <button 
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0"
            style={{ color: '#475569', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            onClick={onClose} 
            aria-label="Bezárás"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className={`p-5 md:p-6 ${overflowVisible ? 'overflow-visible' : 'overflow-y-auto custom-scrollbar'}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
