import type { SystemAnnouncement, SystemAnnouncementType } from '@/types/admin';

export interface RawSystemAnnouncement {
  id: number;
  message: string;
  type: SystemAnnouncementType;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
}

export interface RawSystemAnnouncementsResponse {
  data: RawSystemAnnouncement[];
}

export function mapSystemAnnouncementFromApi(raw: RawSystemAnnouncement): SystemAnnouncement {
  return {
    id: raw.id,
    message: raw.message,
    type: raw.type,
    isActive: Boolean(raw.isActive ?? raw.is_active),
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
  };
}

export function mapSystemAnnouncementsFromApi(raw: RawSystemAnnouncement[]): SystemAnnouncement[] {
  return raw.map(mapSystemAnnouncementFromApi);
}

export function formatAnnouncementTypeLabel(type: SystemAnnouncementType): string {
  switch (type) {
    case 'info':
      return 'Információ';
    case 'warning':
      return 'Figyelmeztetés';
    case 'danger':
      return 'Sürgős';
    default:
      return type;
  }
}
