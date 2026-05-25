export interface ApiResponse<T> {
  data: T;
  status: number;
}

export type RequestOptions = {
  silent?: boolean;
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined | null>;
};
