'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export function Logo({ size = 'md', className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        'font-bold tracking-tight hover:opacity-90 transition-opacity',
        sizeClasses[size],
        className
      )}
    >
      <span className="bg-gradient-to-r from-fpl-green to-fpl-light bg-clip-text text-transparent">
        FPL Optimizer
      </span>
    </Link>
  );
}
