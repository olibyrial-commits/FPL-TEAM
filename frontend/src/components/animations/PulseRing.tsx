'use client';

import { motion } from 'framer-motion';

interface PulseRingProps {
  size?: number;
  color?: string;
  duration?: number;
  className?: string;
}

export function PulseRing({
  size = 12,
  color = '#00ff85',
  duration = 2,
  className = '',
}: PulseRingProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Center dot */}
      <div
        className="rounded-full z-10"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
      />

      {/* Pulse rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{
            borderColor: color,
            willChange: 'transform, opacity',
          }}
          initial={{ width: size, height: size, opacity: 0.6 }}
          animate={{
            width: [size, size * 4],
            height: [size, size * 4],
            opacity: [0.6, 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay: i * (duration / 3),
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

interface LiveIndicatorProps {
  text?: string;
  className?: string;
}

export function LiveIndicator({
  text = 'Live',
  className = '',
}: LiveIndicatorProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <PulseRing size={8} color="#00ff85" duration={1.5} />
      <span className="text-fpl-light font-medium text-sm">{text}</span>
    </div>
  );
}
