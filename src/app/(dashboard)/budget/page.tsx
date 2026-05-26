import { Metadata } from 'next';
import { BudgetPage } from '@/components/modules/budget/budget-page';
import { BudgetUiProvider } from '@/components/modules/budget/BudgetUiContext';
import { BudgetLogicProvider } from '@/components/modules/budget/BudgetLogicContext';

export const metadata: Metadata = {
  title: 'Költségvetés | Háztartás Menedzser',
};

export default function Page() {
  return (
    <BudgetUiProvider>
      <BudgetLogicProvider>
        <BudgetPage />
      </BudgetLogicProvider>
    </BudgetUiProvider>
  );
}
