export interface MeterReading {
  id: number;
  date: string;
  month: number;
  year: number;
  value: number;
  is_reset: boolean;
  consumption: number;
  is_estimated?: boolean;
  is_official?: boolean;
}

export interface Meter {
  id: number;
  name: string;
  icon: string;
  unit: string;
  location: string;
  readings: MeterReading[];
}

export interface CreateMeterPayload {
  name: string;
  icon?: string;
  unit: string;
  location: string;
}

export interface CreateReadingPayload {
  date: string;
  value: number;
  is_reset?: boolean;
  is_estimated?: boolean;
  is_official?: boolean;
  month?: number;
  year?: number;
}

export type UpdateReadingPayload = Partial<CreateReadingPayload>;
