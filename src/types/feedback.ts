import type { FeedbackCategory, FeedbackStatus } from '@/config/feedback';

export type FeedbackReportUser = {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
};

export type FeedbackReportHousehold = {
  id: number;
  name: string;
};

export type FeedbackReportAttachment = {
  id: number;
  originalName: string | null;
  mime: string | null;
  sizeBytes: number;
  legacy?: boolean;
};

export type FeedbackReportMessage = {
  id: number;
  author: 'user' | 'admin';
  body: string;
  createdAt: string | null;
  user: FeedbackReportUser | null;
};

export type FeedbackReport = {
  id: number;
  category: FeedbackCategory | string;
  subject: string | null;
  message: string;
  status: FeedbackStatus;
  pageUrl: string | null;
  attachments: FeedbackReportAttachment[];
  hasAttachment: boolean;
  messages: FeedbackReportMessage[];
  hasUnreadReply?: boolean;
  needsAdminAttention?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  user: FeedbackReportUser | null;
  household: FeedbackReportHousehold | null;
};
