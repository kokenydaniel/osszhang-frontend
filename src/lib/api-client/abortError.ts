export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  return error instanceof Error && error.name === 'AbortError';
}

export function isTimeoutError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return true;
  }
  return error instanceof Error && error.name === 'TimeoutError';
}

export function mergeAbortSignals(signals: AbortSignal[]): AbortSignal {
  const active = signals.filter((s) => s.aborted === false);
  if (active.length === 0) {
    return AbortSignal.abort(signals[0]?.reason);
  }
  if (active.length === 1) {
    return active[0]!;
  }
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any(active);
  }

  const controller = new AbortController();
  const onAbort = () => {
    const reason = active.find((s) => s.aborted)?.reason;
    controller.abort(reason);
  };
  for (const signal of active) {
    signal.addEventListener('abort', onAbort, { once: true });
  }
  return controller.signal;
}
