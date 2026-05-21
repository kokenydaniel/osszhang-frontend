import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Baby,
  Briefcase,
  Building2,
  Car,
  CreditCard,
  Handshake,
  Heart,
  PawPrint,
  Plane,
  Smartphone,
  Tv,
  User,
  Users,
} from 'lucide-react';
import type { PersonalizationQuestionId } from '@/lib/onboardingPersonalization';

export const HOUSEHOLD_VIBE_ICONS: Record<string, LucideIcon> = {
  family: Users,
  couple: Heart,
  solo: User,
  roommates: Handshake,
};

export const PERSONALIZATION_QUESTION_ICONS: Record<PersonalizationQuestionId, LucideIcon> = {
  pet: PawPrint,
  car: Car,
  children: Baby,
  rent: Building2,
  subscriptions: Tv,
  telecom: Smartphone,
  travel: Plane,
  fitness: Activity,
  business: Briefcase,
  debts: CreditCard,
};
