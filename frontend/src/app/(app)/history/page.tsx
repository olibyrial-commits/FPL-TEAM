'use client';

import { PremiumFeature } from '@/components/PremiumFeature';
import { useDemoAuth } from '@/components/DemoAuthProvider';

export default function HistoryPage() {
  const { demoUser, isDemoMode } = useDemoAuth();
  const tier = demoUser?.tier || 'free';

  return (
    <PremiumFeature
      tier={tier}
      requiredTier="pro"
      featureName="History Tracking"
      description="Track all your optimizations and compare results across gameweeks"
      ctaText="Want to track your optimization history?"
      ctaLink="/pricing"
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Optimization History</h1>
          <p className="text-muted-foreground mt-2">
            View your past optimizations and track performance over time
          </p>
        </div>

        <div className="bg-card border rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The history feature is currently under development. 
            Soon you will be able to track all your optimizations and compare results across gameweeks.
          </p>
        </div>
      </div>
    </PremiumFeature>
  );
}
