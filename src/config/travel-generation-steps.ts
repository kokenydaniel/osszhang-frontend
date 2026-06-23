import type { AsyncStepProgressStep } from '@/components/design/async-step-progress';
import type { TravelFormInput } from '@/types/travel';
import {
  TRAVEL_ACCOMMODATION_OPTIONS,
  TRAVEL_TRANSPORT_OPTIONS,
} from '@/types/travel';
import {
  BedDouble,
  CalendarDays,
  Car,
  MapPinned,
  PiggyBank,
  Plane,
  Sparkles,
  TrainFront,
  Bus,
  Shuffle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function transportIcon(mode: TravelFormInput['transportMode']): LucideIcon {
  switch (mode) {
    case 'car':
      return Car;
    case 'plane':
      return Plane;
    case 'train':
      return TrainFront;
    case 'bus':
      return Bus;
    default:
      return Shuffle;
  }
}

export function buildTravelGenerationSteps(values: TravelFormInput): AsyncStepProgressStep[] {
  const destination = values.destination.trim() || 'úticél';
  const origin = values.originLocation.trim() || 'Budapest';
  const days = values.durationDays.trim() || '—';
  const travelers = values.travelersCount.trim() || '1';
  const transport =
    TRAVEL_TRANSPORT_OPTIONS.find((option) => option.value === values.transportMode)?.label ?? 'Közlekedés';
  const accommodation =
    TRAVEL_ACCOMMODATION_OPTIONS.find((option) => option.value === values.accommodationPreference)?.label ??
    'Szállás';

  return [
    {
      id: 'destination',
      icon: MapPinned,
      label: `${destination} — célállomás feldolgozása`,
      description: `Indulás: ${origin} · ${days} nap · ${travelers} fő`,
    },
    {
      id: 'transport',
      icon: transportIcon(values.transportMode),
      label: `${transport} költség becslése`,
      description: values.transportAlreadyBooked
        ? 'Közlekedés már megvan — csak helyszíni tételek'
        : 'Üzemanyag, jegy, útdíj realisztikus sávban',
    },
    {
      id: 'stay',
      icon: BedDouble,
      label: 'Szállás és étkezés kalkuláció',
      description: values.accommodationAlreadyBooked
        ? 'Szállás már megvan — csak étkezés és programok'
        : `${accommodation} preferencia alapján`,
    },
    {
      id: 'finance',
      icon: PiggyBank,
      label: 'Pénzügyi illeszkedés ellenőrzése',
      description: 'Megtakarítások, Marad és havi kapacitás összevetése',
    },
    {
      id: 'itinerary',
      icon: CalendarDays,
      label: `Napi program — ${days} nap`,
      description: 'Programok és becsült napi költségek összeállítása',
    },
    {
      id: 'finalize',
      icon: Sparkles,
      label: 'Utazási terv összeállítása',
      description: 'Költségbontás, összefoglaló és javaslatok finalizálása',
    },
  ];
}
