import { create } from 'zustand';
import { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  addNotification: (message: string, type?: Notification['type']) => void;
  removeNotification: (id: number) => void;
}

let notificationIdSeq = 0;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (message, type = 'info') => {
    const id = Date.now() * 1000 + (++notificationIdSeq % 1000);
    set({ notifications: [...get().notifications, { id, message, type }] });
    setTimeout(() => get().removeNotification(id), 5000);
  },

  removeNotification: (id) =>
    set({ notifications: get().notifications.filter((n) => n.id !== id) }),
}));
