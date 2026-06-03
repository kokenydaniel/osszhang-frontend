'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import classNames from 'classnames';

interface AnimatedHeightProps {
  children: ReactNode;
  contentKey?: string | number;
  className?: string;
}

export function AnimatedHeight({ children, contentKey, className }: AnimatedHeightProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    let frame = 0;
    const measure = () => {
      const next = el.scrollHeight;
      setHeight((prev) => (prev === next ? prev : next));
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    scheduleMeasure();
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [contentKey]);

  return (
    <motion.div
      className={classNames('overflow-hidden', className)}
      initial={false}
      animate={{ height: height ?? 'auto' }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      <div ref={innerRef}>{children}</div>
    </motion.div>
  );
}
