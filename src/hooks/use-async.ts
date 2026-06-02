'use client';

import { useEffect, useState } from 'react';

import { LoadableStatus } from '@/utils/loadable-status';
import { StatusCodes } from '@/types/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional: generic bound for arbitrary async functions
type AsyncFunction = (...params: any[]) => Promise<any>;

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: LoadableStatus;
  refresh: () => Promise<void>;
  mutate: (newData: T) => void;
}

export const useAsync = <
  C extends AsyncFunction,
  R = Awaited<ReturnType<C>>
>(
  asyncFunction: C,
  params: Parameters<C>
): AsyncState<R> => {
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<LoadableStatus>(LoadableStatus.Unloaded);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setStatus(LoadableStatus.Loading);

        const result = await asyncFunction(...params);

        setData(result as R);
        setStatus(LoadableStatus.Loaded);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error);
        }

        const statusCode = String((error as Record<string, unknown>)?.status);

        if (
          statusCode === StatusCodes.Http500 ||
          statusCode === StatusCodes.Http422
        ) {
          setStatus(LoadableStatus.Error);
          return;
        }

        setStatus(LoadableStatus.NotFound);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [...params, refreshTrigger]);

  const refresh = async () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const mutate = (newData: R) => {
    setData(newData);
  };

  return { data, loading, error, status, refresh, mutate };
};
