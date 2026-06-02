export enum StatusCodes {
  Http200 = '200',
  Http201 = '201',
  Http204 = '204',
  Http400 = '400',
  Http401 = '401',
  Http403 = '403',
  Http404 = '404',
  Http422 = '422',
  Http500 = '500',
  Http503 = '503',
}

export type SupportedStatusCodes =
  | StatusCodes.Http200
  | StatusCodes.Http201
  | StatusCodes.Http204
  | StatusCodes.Http400
  | StatusCodes.Http401
  | StatusCodes.Http403
  | StatusCodes.Http404
  | StatusCodes.Http422
  | StatusCodes.Http500
  | StatusCodes.Http503;

export type Nullable<T> = T | null;

export type ApiClientResponse<S extends SupportedStatusCodes, T> = [S, T];

export type SingleEntityResponse<T> = Promise<
  Nullable<
    | ApiClientResponse<StatusCodes.Http200, T>
    | ApiClientResponse<StatusCodes.Http201, T>
  >
>;

export type CollectionResponse<T> = Promise<
  Nullable<ApiClientResponse<StatusCodes.Http200, T[]>>
>;

export type EmptyResponse = Promise<
  Nullable<
    | ApiClientResponse<StatusCodes.Http200, null>
    | ApiClientResponse<StatusCodes.Http201, null>
    | ApiClientResponse<StatusCodes.Http204, null>
  >
>;

// ── Error response types ──────────────────────────────────────────────────────

export type ValidateErrorMessages = string[];

export interface ValidationErrorApiResponse {
  errors: {
    [key: string]: ValidateErrorMessages;
  };
}

export interface GeneralErrorApiResponse {
  message: string;
}

// ── Request options ───────────────────────────────────────────────────────────

export type RequestOptions = {
  silent?: boolean;
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
};

export type MaintenanceErrorPayload = {
  message?: string;
  code?: string;
};
