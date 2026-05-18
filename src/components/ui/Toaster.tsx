'use client';

import React from 'react';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export const Toaster: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-8 right-4 md:right-8 z-[20000] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 md:px-0">
      {notifications.map(n => (
        <div key={n.id} className={`pointer-events-auto w-full bg-slate-900/95 backdrop-blur-xl border rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-8 duration-300
          ${n.type === 'success' ? 'border-green-500/20' : n.type === 'error' ? 'border-red-500/20' : 'border-blue-500/20'}
        `}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
            ${n.type === 'success' ? 'bg-green-500/10 text-green-500' : 
              n.type === 'error' ? 'bg-red-500/10 text-red-500' : 
              'bg-blue-500/10 text-blue-500'}
          `}>
            {n.type === 'success' && <CheckCircle size={18} />}
            {n.type === 'error' && <XCircle size={18} />}
            {n.type === 'info' && <Info size={18} />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{n.message}</div>
          </div>

          <button 
            onClick={() => removeNotification(n.id)}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
