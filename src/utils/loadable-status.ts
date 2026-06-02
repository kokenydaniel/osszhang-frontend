export enum LoadableStatus {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
  Unloaded = 'unloaded',
  NotFound = 'not_found',
}

export function isStoreLoading(status: LoadableStatus): boolean {
  return status === LoadableStatus.Unloaded || status === LoadableStatus.Loading;
}

export function isNotFoundStatus(status: LoadableStatus): boolean {
  return status === LoadableStatus.NotFound;
}
