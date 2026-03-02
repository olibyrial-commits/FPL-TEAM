'use client';

import { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export function GradientText({
  children,
  className = '',
  animate = true,
}: GradientTextProps) {
  return (
    <span
      className={`
        bg-gradient-to-r from-fpl-light via-fpl-pink to-fpl-light
        bg-[length:200%_auto]
        bg-clip-text text-transparent
        ${animate ? 'animate-gradient' : ''}
        ${className}
      `}
      style={{
        willChange: 'background-position',
      }}
    >
      {children}
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
          100% {
            background-position: 0% center;
          }
        }
        .animate-gradient {
          animation: gradient 4s linear infinite;
        }
      `}</style>
    </span>
  );
}
