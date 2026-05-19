'use client';

import React from 'react';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react';

export const Toaster: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  if (notifications.length === 0) return null;

  const config = {
    success: {
      icon: <CheckCircle2 size={18} />,
      iconBg: 'rgba(52,211,153,0.12)',
      iconColor: '#34d399',
      border: 'rgba(52,211,153,0.2)',
      bar: '#34d399',
    },
    error: {
      icon: <XCircle size={18} />,
      iconBg: 'rgba(248,113,113,0.12)',
      iconColor: '#f87171',
      border: 'rgba(248,113,113,0.2)',
      bar: '#f87171',
    },
    warning: {
      icon: <AlertTriangle size={18} />,
      iconBg: 'rgba(251,191,36,0.12)',
      iconColor: '#fbbf24',
      border: 'rgba(251,191,36,0.2)',
      bar: '#fbbf24',
    },
    info: {
      icon: <Info size={18} />,
      iconBg: 'rgba(96,165,250,0.12)',
      iconColor: '#60a5fa',
      border: 'rgba(96,165,250,0.2)',
      bar: '#60a5fa',
    },
  };

  return (
    <div className="fixed top-5 right-4 md:right-6 z-[20000] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 md:px-0">
      {notifications.map(n => {
        const c = config[n.type as keyof typeof config] || config.info;
        return (
          <div 
            key={n.id} 
            className="pointer-events-auto w-full flex items-center gap-3 p-4 animate-in slide-in-from-right-8 duration-300 relative overflow-hidden"
            style={{
              background: 'rgba(15, 20, 32, 0.97)',
              border: `1px solid ${c.border}`,
              borderRadius: '16px',
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)`,
            }}
          >
            {/* Left color bar */}
            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full" style={{ background: c.bar }} />
            
            {/* Icon */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ml-2" style={{ background: c.iconBg, color: c.iconColor }}>
              {c.icon}
            </div>
            
            {/* Message */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white leading-snug">{n.message}</div>
            </div>

            {/* Close */}
            <button 
              onClick={() => removeNotification(n.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all shrink-0"
              style={{ color: '#475569', background: 'rgba(255,255,255,0.04)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
