import type { ValidationErrorApiResponse, GeneralErrorApiResponse } from '@/types/api';

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isObjectInstanceByProperties<T>(
  subject: unknown,
  properties: (keyof T)[] = [],
): subject is T {
  if (!isObject(subject)) return false;
  return properties.every((prop) => prop in subject);
}

export function isSingleEntityApiResponse<T>(
  response: unknown,
  requiredKeys: (keyof T)[] = [],
): response is T {
  return isObjectInstanceByProperties<T>(response, requiredKeys);
}

/** Laravel JsonResource returns `{ data: entity }`; plain controllers return the entity directly. */
export function unwrapApiEntity<T>(
  response: unknown,
  requiredKeys: (keyof T)[] = [],
): T | null {
  if (isSingleEntityApiResponse<T>(response, requiredKeys)) {
    return response;
  }
  if (isObject(response) && isObject(response.data)) {
    const nested = response.data;
    if (isSingleEntityApiResponse<T>(nested, requiredKeys)) {
      return nested;
    }
  }
  return null;
}

export function isCollectionApiResponse<T>(
  response: unknown,
  requiredItemKeys: (keyof T)[] = [],
): response is T[] {
  if (!isArray(response)) return false;
  if (response.length > 0) {
    return isObjectInstanceByProperties<T>(response[0], requiredItemKeys);
  }
  return true;
}

/** `{ data: T[] }` vagy közvetlen tömb. */
export function unwrapApiCollection<T>(
  response: unknown,
  requiredItemKeys: (keyof T)[] = [],
): T[] | null {
  if (isCollectionApiResponse<T>(response, requiredItemKeys)) {
    return response;
  }
  if (isObject(response) && isArray(response.data)) {
    const nested = response.data;
    if (isCollectionApiResponse<T>(nested, requiredItemKeys)) {
      return nested;
    }
  }
  return null;
}

export function isValidationErrorApiResponse(
  subject: unknown,
): subject is ValidationErrorApiResponse {
  return (
    isObjectInstanceByProperties<ValidationErrorApiResponse>(subject, ['errors']) &&
    isObject(subject.errors)
  );
}

export function isGeneralErrorApiResponse(
  subject: unknown,
): subject is GeneralErrorApiResponse {
  return isObjectInstanceByProperties<GeneralErrorApiResponse>(subject, ['message']);
}
