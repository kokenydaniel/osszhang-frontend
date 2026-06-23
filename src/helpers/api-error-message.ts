import {
  isGeneralErrorApiResponse,
  isValidationErrorApiResponse,
} from '@/lib/api-client/type-guards';

export function getValidationFieldError(
  response: object | null,
  field: string,
): string | null {
  if (!response || !isValidationErrorApiResponse(response)) return null;
  const messages = response.errors[field];
  const first = messages?.find((message): message is string => typeof message === 'string');
  return first ?? null;
}

export function formatUsernameValidationMessage(message: string): string {
  if (/already been taken/i.test(message)) {
    return 'Ez a felhasználónév már foglalt.';
  }
  return message;
}

export function getApiErrorMessage(
  status: string | number,
  response: object | null,
  fallback = 'A mentés nem sikerült.',
): string {
  const code = String(status);

  if (response && isValidationErrorApiResponse(response)) {
    const first = Object.values(response.errors).flat().find(Boolean);
    if (typeof first === 'string') return first;
    return 'Érvénytelen adatok. Ellenőrizd a mezőket.';
  }

  if (response && isGeneralErrorApiResponse(response)) {
    return response.message;
  }

  if (response && typeof response === 'object' && 'message' in response) {
    const msg = (response as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }

  if (code === '403') {
    return 'Nincs jogosultság a módosításhoz, vagy a Biztosítások modul nincs bekapcsolva.';
  }
  if (code === '401') return 'A munkamenet lejárt. Jelentkezz be újra.';
  if (code === '422') return 'Érvénytelen adatok. Ellenőrizd a mezőket.';
  if (code === '404') return 'A kért szolgáltatás nem található (API).';
  if (code === '500' || code === '503') {
    return 'Szerverhiba. Ha friss telepítés, futtasd a backend migrációkat (`php artisan migrate`).';
  }

  return fallback;
}
