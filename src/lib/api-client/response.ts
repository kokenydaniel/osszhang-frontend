export interface ApiResponse<T> {
  data: T;
  status: number;
}

export type RequestOptions = {
  silent?: boolean;
  params?: Record<string, string | number | boolean | undefined | null>;
};
