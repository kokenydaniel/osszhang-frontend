import { Metadata } from 'next';
import BudgetClient from '@/components/modules/budget/BudgetClient';

export const metadata: Metadata = {
  title: 'Költségvetés | Háztartás Menedzser',
};

export default function BudgetPage() {
  return <BudgetClient />;
}
