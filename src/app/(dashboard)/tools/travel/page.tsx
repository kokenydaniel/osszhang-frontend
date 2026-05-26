import { Metadata } from 'next';
import { TravelUiProvider } from '@/components/modules/travel/TravelUiContext';
import { TravelPage } from '@/components/modules/travel/travel-page';

export const metadata: Metadata = {
  title: 'Utazástervező | Okos eszközök',
};

export default function TravelPlannerRoutePage() {
  return (
    <TravelUiProvider>
      <TravelPage />
    </TravelUiProvider>
  );
}
