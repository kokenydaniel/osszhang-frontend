export interface MeterReading {
  id: number;
  date: string;
  month: number;
  year: number;
  value: number;
  isReset: boolean;
  is_reset?: boolean;
  consumption: number;
  isEstimated?: boolean;
  is_estimated?: boolean;
  isOfficial?: boolean;
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
