'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedHeightProps {
  children: ReactNode;
  /** Tartalomváltáskor újramérés (pl. aktív fül). */
  contentKey?: string | number;
  className?: string;
}

export function AnimatedHeight({ children, contentKey, className }: AnimatedHeightProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const measure = () => {
      setHeight(el.scrollHeight);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, contentKey]);

  return (
    <motion.div
      className={cn('overflow-hidden', className)}
      initial={false}
      animate={{ height: height ?? 'auto' }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      <div ref={innerRef}>{children}</div>
    </motion.div>
  );
}
