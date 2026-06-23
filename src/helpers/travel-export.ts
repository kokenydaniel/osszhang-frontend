import { getAuthToken } from '@/helpers/auth-token';
import { buildApiUrl } from '@/lib/api-client/build-api-url';
import { API_URL } from '@/lib/api-client/public-env';
import type { AiMeta, AiTravelPlan } from '@/types/ai';
import {
  TRAVEL_ACCOMMODATION_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
  TRAVEL_TRANSPORT_OPTIONS,
  type TravelFormInput,
} from '@/types/travel';

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename.trim() || 'utazas.pdf';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function slugifyDestination(destination: string): string {
  return destination
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9áéíóöőúüű]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'utazas';
}

export function buildTravelFormLabels(form: TravelFormInput): Record<string, string> {
  const labels: Record<string, string> = {
    trip_style: TRAVEL_STYLE_OPTIONS.find((o) => o.value === form.tripStyle)?.label ?? form.tripStyle,
    accommodation:
      TRAVEL_ACCOMMODATION_OPTIONS.find((o) => o.value === form.accommodationPreference)?.label ??
      form.accommodationPreference,
    transport: TRAVEL_TRANSPORT_OPTIONS.find((o) => o.value === form.transportMode)?.label ?? form.transportMode,
    transport_booked: form.transportAlreadyBooked ? 'Igen' : 'Nem',
    accommodation_booked: form.accommodationAlreadyBooked ? 'Igen' : 'Nem',
  };

  if (form.transportMode === 'car' && form.carFuelConsumption.trim()) {
    labels.car_fuel = `${form.carFuelConsumption.trim()} l/100 km`;
  }

  return labels;
}

export async function downloadTravelPlanPdf(
  plan: AiTravelPlan,
  form: TravelFormInput,
  meta?: AiMeta | null,
): Promise<boolean> {
  const token = getAuthToken();
  const url = buildApiUrl('tools/travel/pdf', undefined, API_URL);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Accept: 'application/pdf',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        plan,
        form,
        form_labels: buildTravelFormLabels(form),
        meta: meta
          ? {
              fallback_used: meta.fallback_used ?? false,
              failure_reason: meta.failure_reason ?? null,
            }
          : undefined,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType.includes('json')) {
      return false;
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) {
      return false;
    }

    const fromHeader = response.headers.get('Content-Disposition');
    const headerName = fromHeader?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1];
    const decodedName = headerName ? decodeURIComponent(headerName) : null;
    const fallbackName = `utazas-${slugifyDestination(plan.destination)}.pdf`;

    triggerBrowserDownload(new Blob([buffer], { type: 'application/pdf' }), decodedName ?? fallbackName);
    return true;
  } catch {
    return false;
  }
}
