export enum LoadableStatus {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
  Unloaded = 'unloaded',
}

export function isStoreLoading(status: LoadableStatus): boolean {
  return status === LoadableStatus.Unloaded || status === LoadableStatus.Loading;
}
