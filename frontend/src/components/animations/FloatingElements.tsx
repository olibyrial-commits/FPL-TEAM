'use client';

import { motion } from 'framer-motion';

interface FloatingShape {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface FloatingElementsProps {
  count?: number;
  className?: string;
}

export function FloatingElements({
  count = 8,
  className = '',
}: FloatingElementsProps) {
  // Generate random floating shapes
  const shapes: FloatingShape[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 60 + 20,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 15,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.15 + 0.05,
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute rounded-full"
          style={{
            width: shape.size,
            height: shape.size,
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            background: `radial-gradient(circle, rgba(0, 255, 133, ${shape.opacity}) 0%, transparent 70%)`,
            willChange: 'transform',
          }}
          animate={{
            y: [0, -30, 0, 30, 0],
            x: [0, 20, 0, -20, 0],
            scale: [1, 1.1, 1, 0.9, 1],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Football/soccer ball shapes */}
      {shapes.slice(0, 3).map((shape, i) => (
        <motion.div
          key={`ball-${i}`}
          className="absolute"
          style={{
            width: shape.size * 1.5,
            height: shape.size * 1.5,
            left: `${(shape.x + 20) % 100}%`,
            top: `${(shape.y + 30) % 100}%`,
            opacity: shape.opacity * 0.6,
            willChange: 'transform',
          }}
          animate={{
            y: [0, -50, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: shape.duration * 1.5,
            delay: shape.delay + 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <circle cx="12" cy="12" r="10" stroke="rgba(0, 255, 133, 0.3)" strokeWidth="1" fill="none" />
            <path
              d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12"
              stroke="rgba(0, 255, 133, 0.2)"
              strokeWidth="1"
            />
            <circle cx="12" cy="12" r="3" stroke="rgba(0, 255, 133, 0.2)" strokeWidth="1" fill="none" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
