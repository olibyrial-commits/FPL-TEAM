'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';
  duration?: number;
  className?: string;
  once?: boolean;
}

const directionVariants = {
  up: { y: 40, x: 0, scale: 1 },
  down: { y: -40, x: 0, scale: 1 },
  left: { x: 40, y: 0, scale: 1 },
  right: { x: -40, y: 0, scale: 1 },
  scale: { x: 0, y: 0, scale: 0.9 },
  fade: { x: 0, y: 0, scale: 1 },
};

export function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  duration = 0.6,
  className = '',
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-50px' });

  const initial = {
    opacity: 0,
    ...directionVariants[direction],
  };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? { opacity: 1, x: 0, y: 0, scale: 1 } : initial}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1.0],
      }}
      className={className}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}
