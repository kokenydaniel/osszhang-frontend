'use client';

import { useLayoutEffect, useState } from 'react';

/** Compensates iOS Safari fixed-position drift while the page scrolls. */
export function useVisualViewportBottomInset(): number {
  const [inset, setInset] = useState(0);

  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const sync = () => {
      setInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    };

    sync();
    viewport.addEventListener('resize', sync);
    viewport.addEventListener('scroll', sync);
    window.addEventListener('scroll', sync, { passive: true });

    return () => {
      viewport.removeEventListener('resize', sync);
      viewport.removeEventListener('scroll', sync);
      window.removeEventListener('scroll', sync);
    };
  }, []);

  return inset;
}
