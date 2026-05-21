'use client';

import React from 'react';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react';
import classNames from 'classnames';
import { Button } from '@/components/ui/button';

export const Toaster: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();
  if (notifications.length === 0) return null;

  const config = {
    success: { icon: CheckCircle2, className: 'bg-emerald-50 border-emerald-200 text-emerald-800', iconClass: 'text-emerald-600' },
    error:   { icon: XCircle,      className: 'bg-red-50 border-red-200 text-red-800',             iconClass: 'text-red-600' },
    warning: { icon: AlertTriangle,className: 'bg-amber-50 border-amber-200 text-amber-800',       iconClass: 'text-amber-600' },
    info:    { icon: Info,         className: 'bg-blue-50 border-blue-200 text-blue-800',           iconClass: 'text-blue-600' },
  };

  return (
    <div className="fixed top-5 right-4 md:right-6 z-[20000] flex flex-col gap-2 w-full max-w-sm px-4 md:px-0">
      {notifications.map(n => {
        const c = config[n.type as keyof typeof config] || config.info;
        const Icon = c.icon;
        return (
          <div
            key={n.id}
            className={classNames(
              "flex items-center gap-3 p-3.5 rounded-xl border shadow-md animate-in slide-in-from-right-8 duration-200",
              c.className
            )}
          >
            <Icon size={18} className={classNames("shrink-0", c.iconClass)} />
            <p className="flex-1 text-sm font-semibold leading-snug">{n.message}</p>
            <button
              onClick={() => removeNotification(n.id)}
              className="shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
