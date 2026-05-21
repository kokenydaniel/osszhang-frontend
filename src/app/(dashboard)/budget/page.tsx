import { Metadata } from 'next';
import BudgetPage from '@/components/modules/budget/budget-page';

export const metadata: Metadata = {
  title: 'Költségvetés | Háztartás Menedzser',
};

export default function Page() {
  return <BudgetPage />;
}
