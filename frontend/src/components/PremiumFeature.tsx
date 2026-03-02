'use client';

import { ReactNode } from 'react';
import { useDemoAuth } from '@/components/DemoAuthProvider';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Zap, Crown, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

interface PremiumFeatureProps {
  tier?: 'free' | 'pro' | 'elite' | null;
  requiredTier: 'pro' | 'elite';
  featureName: string;
  description?: string;
  children: ReactNode;
  ctaText?: string;
  ctaLink?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'overlay' | 'compact';
  showBadge?: boolean;
  className?: string;
}

const tierOrder = { free: 0, pro: 1, elite: 2 };

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 20 4" />
    </svg>
  );
}

export function PremiumFeature({
  tier,
  requiredTier = 'pro',
  featureName,
  description,
  children,
  ctaText,
  ctaLink,
  size = 'md',
  variant = 'overlay',
  showBadge = true,
  className = '',
}: PremiumFeatureProps) {
  const { demoUser, isDemoMode } = useDemoAuth();
  
  let userTier: 'free' | 'pro' | 'elite' = 'free';
  
  if (isDemoMode && demoUser) {
    userTier = demoUser.tier;
  }
  
  const inferredTier = (tier || userTier) as 'free' | 'pro' | 'elite';
  const userLevel = tierOrder[inferredTier];
  const requiredLevel = tierOrder[requiredTier];
  const isBlocked = userLevel < requiredLevel;

  if (!isBlocked) {
    return <>{children}</>;
  }

  // Compact variant - for sliders, chips, small controls
  if (variant === 'compact') {
    return (
      <div className={cn("relative", className)}>
        <div className="filter blur-[2px] opacity-40 pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              {requiredTier === 'elite' ? (
                <Crown className="h-4 w-4 text-fpl-pink" />
              ) : (
                <Sparkles className="h-4 w-4 text-fpl-light" />
              )}
              <span className="text-sm font-medium">{requiredTier === 'elite' ? 'Elite' : 'Pro'} only</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
              <Link href={ctaLink || '/pricing'}>
                Upgrade
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full overlay variant - for pages like History
  const tierColors = {
    pro: 'bg-fpl-light text-fpl-green',
    elite: 'bg-fpl-pink text-white',
  };

  const tierIcon = requiredTier === 'elite' ? Crown : Zap;
  const tierColor = tierColors[requiredTier];

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "filter blur-[3px] opacity-50 pointer-events-none select-none transition-all duration-300"
      )}>
        {children}
      </div>

      <div className={cn(
        "absolute inset-0 flex items-center justify-center p-4",
        "bg-background/50"
      )}>
        <Card className={cn(
          "border-2 shadow-xl max-w-md",
          requiredTier === 'elite' ? "border-fpl-pink" : "border-fpl-light"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="font-semibold">
                  {requiredTier === 'elite' ? 'Elite' : 'Pro'} Feature
                </span>
              </div>
              {showBadge && (
                <Badge variant="default" className={tierColor}>
                  {requiredTier === 'elite' ? 'ELITE' : 'PRO'}
                </Badge>
              )}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="pt-4">
            <p className="text-sm text-center mb-4">
              {ctaText || `Unlock ${featureName} and other premium features`}
            </p>
            
            {requiredTier === 'elite' && (
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground mb-4">
                <CheckIcon className="h-4 w-4 mt-0.5 text-fpl-pink flex-shrink-0" />
                <span>8-week horizon planning</span>
              </div>
            )}
            
            {requiredTier === 'pro' && (
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground mb-4">
                <CheckIcon className="h-4 w-4 mt-0.5 text-fpl-light flex-shrink-0" />
                <span>Unlimited optimizations</span>
              </div>
            )}
            
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <CheckIcon className="h-4 w-4 mt-0.5 text-fpl-light flex-shrink-0" />
              <span>Chip optimization</span>
            </div>
          </CardContent>

          <CardFooter className="pt-0">
            <Button className="w-full" asChild>
              <Link href={ctaLink || '/pricing'}>
                {requiredTier === 'elite' ? 'Upgrade to Elite' : 'Upgrade to Pro'}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
