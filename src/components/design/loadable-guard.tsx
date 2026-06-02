import { ReactNode } from 'react';

import { isNotFoundStatus, isStoreLoading, LoadableStatus } from '@/utils/loadable-status';
import { ModulePageSkeleton } from '@/components/design';

type LoadableGuardResponseData<
  T,
  Nullable extends boolean = false
> = Nullable extends true ? T | null : T;

interface LoadableGuardProps<T, Nullable extends boolean = false> {
  data: T | null;
  status: LoadableStatus;
  children: (
    data: LoadableGuardResponseData<T, Nullable>,
    isReloading: boolean
  ) => ReactNode;
  showLoaderOnReload?: boolean;
  loaderComponent?: ReactNode;
  nullable?: Nullable;
}

export function LoadableGuard<T, Nullable extends boolean = false>({
  data,
  status,
  children,
  showLoaderOnReload = false,
  nullable,
  loaderComponent = <ModulePageSkeleton />,
}: LoadableGuardProps<T, Nullable>) {
  const isNullable = nullable ?? false;
  const isLoading = isStoreLoading(status);

  if (isLoading && (showLoaderOnReload || !data)) {
    return loaderComponent;
  }

  if (isNotFoundStatus(status)) {
    return null;
  }

  if (!isNullable && !data) {
    throw new Error('Error occurred while retrieving data');
  }

  return children(data as LoadableGuardResponseData<T, Nullable>, isLoading);
}
