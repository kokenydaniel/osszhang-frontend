import type { Meter, MeterReading } from '@/types/meters';

export type RawMeterReading = {
  id: number;
  date: string;
  month: number;
  year: number;
  value: number;
  isReset?: boolean;
  is_reset?: boolean;
  consumption?: number;
  isEstimated?: boolean;
  is_estimated?: boolean;
  isOfficial?: boolean;
  is_official?: boolean;
};

export type RawMeter = {
  id: number;
  name: string;
  icon?: string;
  unit: string;
  location: string;
  readings?: RawMeterReading[];
};

export type CreateMeterPayload = Omit<Meter, 'id' | 'readings' | 'icon'> & Partial<Pick<Meter, 'icon'>>;
export type CreateReadingPayload = Omit<MeterReading, 'id' | 'consumption'>;
export type UpdateReadingPayload = Partial<Omit<MeterReading, 'id' | 'consumption'>>;

export function mapMeterReadingFromApi(raw: RawMeterReading): MeterReading {
  return {
    id: raw.id,
    date: raw.date,
    month: raw.month,
    year: raw.year,
    value: Number(raw.value),
    consumption: Number(raw.consumption ?? 0),
    isReset: raw.isReset ?? raw.is_reset ?? false,
    isEstimated: raw.isEstimated ?? raw.is_estimated ?? false,
    isOfficial: raw.isOfficial ?? raw.is_official ?? false,
  };
}

export function mapMeterFromApi(raw: RawMeter): Meter {
  return {
    id: raw.id,
    name: raw.name,
    icon: raw.icon ?? '',
    unit: raw.unit,
    location: raw.location,
    readings: (raw.readings ?? []).map(mapMeterReadingFromApi),
  };
}

export function mapMetersFromApi(rows: RawMeter[]): Meter[] {
  return rows.map(mapMeterFromApi);
}

export function meterToApiPayload(payload: CreateMeterPayload): Record<string, unknown> {
  return { ...payload };
}

export function readingToApiPayload(payload: CreateReadingPayload | UpdateReadingPayload): Record<string, unknown> {
  return { ...payload };
}
