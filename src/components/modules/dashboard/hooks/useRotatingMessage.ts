'use client';

import { useEffect, useState } from 'react';

export function useRotatingMessage(messages: readonly string[], intervalMs = 2800, active = true): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active || messages.length <= 1) {
      setIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [active, intervalMs, messages]);

  return messages[index] ?? messages[0] ?? '';
}
